import { prisma } from '../db/client.js';
import { parseId, sendError } from '../utils/http.js';
import {
  completeRunSchema,
  runCaseSchema,
  runSchema,
  validate
} from '../validation/schemas.js';

function conflictError(message) {
  const error = new Error(message);
  error.status = 409;
  return error;
}

function serializeSteps(testSteps, testCase) {
  const steps = testSteps.length
    ? testSteps.map((step) => ({
        position: step.position,
        action: step.action,
        expectedResult: step.expectedResult
      }))
    : [
        {
          position: 1,
          action: testCase.steps,
          expectedResult: testCase.expectedResult
        }
      ];

  return JSON.stringify(steps);
}

function parseSnapshotSteps(snapshotSteps, testCase) {
  if (snapshotSteps) {
    try {
      return JSON.parse(snapshotSteps);
    } catch {
      // Legacy or manually edited data falls back to the source case below.
    }
  }

  if (testCase?.testSteps?.length) {
    return testCase.testSteps.map((step) => ({
      position: step.position,
      action: step.action,
      expectedResult: step.expectedResult
    }));
  }

  return testCase
    ? [
        {
          position: 1,
          action: testCase.steps,
          expectedResult: testCase.expectedResult
        }
      ]
    : [];
}

function parseOptionalQueryId(value, label) {
  if (!value) {
    return undefined;
  }

  return parseId(value, label);
}

function serializeRunContext(run) {
  return {
    testPlan: run.snapshotPlanName
      ? { id: run.testPlanId, name: run.snapshotPlanName }
      : null,
    milestone: run.snapshotMilestoneName
      ? { id: run.milestoneId, name: run.snapshotMilestoneName }
      : null,
    environment: run.snapshotEnvironmentName
      ? {
          id: run.environmentId,
          name: run.snapshotEnvironmentName,
          target: run.snapshotEnvironmentTarget
        }
      : null,
    configurations: (run.runConfigurations || []).map((selection) => ({
      optionId: selection.optionId,
      group: selection.snapshotGroupName,
      option: selection.snapshotOptionName,
      position: selection.position
    }))
  };
}

function summarizeRunItems(items) {
  const summary = {
    total: items.length,
    executed: 0,
    untested: 0,
    passed: 0,
    failed: 0,
    blocked: 0,
    skipped: 0,
    completionPercentage: 0
  };

  items.forEach((item) => {
    const key = item.status.toLowerCase();

    if (key in summary) {
      summary[key] += 1;
    }
  });

  summary.executed = summary.total - summary.untested;
  summary.completionPercentage = summary.total
    ? Math.round((summary.executed / summary.total) * 100)
    : 0;

  return summary;
}

export async function listRuns(req, res) {
  try {
    const projectId = parseId(req.params.projectId, 'projectId');
    const testPlanId = parseOptionalQueryId(req.query.testPlanId, 'testPlanId');
    const milestoneId = parseOptionalQueryId(req.query.milestoneId, 'milestoneId');
    const environmentId = parseOptionalQueryId(req.query.environmentId, 'environmentId');
    const configurationOptionId = parseOptionalQueryId(
      req.query.configurationOptionId,
      'configurationOptionId'
    );

    const runs = await prisma.run.findMany({
      where: {
        projectId,
        ...(testPlanId ? { testPlanId } : {}),
        ...(milestoneId ? { milestoneId } : {}),
        ...(environmentId ? { environmentId } : {}),
        ...(configurationOptionId
          ? {
              runConfigurations: {
                some: { optionId: configurationOptionId }
              }
            }
          : {})
      },
      orderBy: { createdAt: 'desc' },
      include: {
        runTestCases: {
          select: { status: true }
        },
        runConfigurations: {
          orderBy: { position: 'asc' }
        }
      }
    });

    res.json(
      runs.map((run) => ({
        id: run.id,
        projectId: run.projectId,
        name: run.name,
        status: run.status,
        completedAt: run.completedAt,
        createdAt: run.createdAt,
        updatedAt: run.updatedAt,
        context: serializeRunContext(run),
        summary: summarizeRunItems(run.runTestCases),
        _count: { runTestCases: run.runTestCases.length }
      }))
    );
  } catch (error) {
    sendError(res, error);
  }
}

export async function createRun(req, res) {
  try {
    const projectId = parseId(req.params.projectId, 'projectId');
    const data = validate(runSchema, req.body);
    let planSections = [];
    let orderedCases = [];
    let testPlan = null;

    if (data.testPlanId) {
      testPlan = await prisma.testPlan.findFirst({
        where: { id: data.testPlanId, projectId },
        include: {
          sections: {
            orderBy: [{ position: 'asc' }, { id: 'asc' }],
            include: {
              items: {
                orderBy: [{ position: 'asc' }, { id: 'asc' }],
                include: {
                  testCase: {
                    include: {
                      testSteps: {
                        orderBy: { position: 'asc' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!testPlan) {
        return res.status(400).json({ error: 'Plano nao pertence ao projeto' });
      }

      if (!testPlan.sections.some((section) => section.items.length > 0)) {
        return res.status(400).json({ error: 'O plano precisa de pelo menos um caso' });
      }

      planSections = testPlan.sections;
    } else {
      const validCases = await prisma.testCase.findMany({
        where: {
          id: { in: data.testCaseIds },
          suite: { projectId }
        },
        include: {
          testSteps: {
            orderBy: { position: 'asc' }
          }
        }
      });

      if (validCases.length !== data.testCaseIds.length) {
        return res.status(400).json({ error: 'Um ou mais casos nao pertencem ao projeto' });
      }

      const casesById = new Map(validCases.map((testCase) => [testCase.id, testCase]));
      orderedCases = data.testCaseIds.map((testCaseId) => casesById.get(testCaseId));
    }

    const milestone = data.milestoneId
      ? await prisma.milestone.findFirst({
          where: { id: data.milestoneId, projectId }
        })
      : null;
    const environment = data.environmentId
      ? await prisma.environment.findFirst({
          where: { id: data.environmentId, projectId }
        })
      : null;

    if (data.milestoneId && !milestone) {
      return res.status(400).json({ error: 'Milestone nao pertence ao projeto' });
    }

    if (milestone?.status === 'Completed') {
      return res.status(400).json({ error: 'Milestone concluido nao aceita novos runs' });
    }

    if (data.environmentId && !environment) {
      return res.status(400).json({ error: 'Ambiente nao pertence ao projeto' });
    }

    const configurationOptions = data.configurationOptionIds.length
      ? await prisma.configurationOption.findMany({
          where: { id: { in: data.configurationOptionIds } },
          include: { group: true }
        })
      : [];

    if (
      configurationOptions.length !== data.configurationOptionIds.length ||
      configurationOptions.some((option) => option.group.projectId !== projectId)
    ) {
      return res.status(400).json({ error: 'Configuracao nao pertence ao projeto' });
    }

    if (
      new Set(configurationOptions.map((option) => option.groupId)).size !==
      configurationOptions.length
    ) {
      return res
        .status(400)
        .json({ error: 'Selecione no maximo uma opcao por grupo de configuracao' });
    }

    const optionsById = new Map(
      configurationOptions.map((option) => [option.id, option])
    );
    const runId = await prisma.$transaction(async (transaction) => {
      const run = await transaction.run.create({
        data: {
          projectId,
          testPlanId: testPlan?.id,
          milestoneId: milestone?.id,
          environmentId: environment?.id,
          name: data.name,
          snapshotPlanName: testPlan?.name,
          snapshotMilestoneName: milestone?.name,
          snapshotEnvironmentName: environment?.name,
          snapshotEnvironmentTarget: environment?.target,
          runConfigurations: {
            create: data.configurationOptionIds.map((optionId, index) => {
              const option = optionsById.get(optionId);

              return {
                optionId,
                position: index + 1,
                snapshotGroupName: option.group.name,
                snapshotOptionName: option.name
              };
            })
          }
        }
      });
      const runItemsByPlanItemId = new Map();
      const pendingDependencies = [];

      if (testPlan) {
        for (const section of planSections) {
          const runSection = await transaction.runPlanSection.create({
            data: {
              runId: run.id,
              name: section.name,
              description: section.description,
              position: section.position
            }
          });

          for (const item of section.items) {
            const testCase = item.testCase;
            const runItem = await transaction.runTestCase.create({
              data: {
                runId: run.id,
                testCaseId: testCase.id,
                runPlanSectionId: runSection.id,
                position: item.position,
                transitionInstructions: item.transitionInstructions,
                snapshotTitle: testCase.title,
                snapshotPreconditions: testCase.preconditions,
                snapshotSteps: serializeSteps(testCase.testSteps, testCase),
                snapshotExpectedResult: testCase.expectedResult,
                snapshotPriority: testCase.priority,
                snapshotType: testCase.type,
                snapshotSeverity: testCase.severity,
                snapshotAutomationStatus: testCase.automationStatus
              },
              select: { id: true }
            });
            runItemsByPlanItemId.set(item.id, runItem.id);

            if (item.dependsOnItemId) {
              pendingDependencies.push({
                runItemId: runItem.id,
                sourceDependencyId: item.dependsOnItemId
              });
            }
          }
        }

        for (const dependency of pendingDependencies) {
          await transaction.runTestCase.update({
            where: { id: dependency.runItemId },
            data: {
              dependsOnRunTestCaseId: runItemsByPlanItemId.get(
                dependency.sourceDependencyId
              )
            }
          });
        }
      } else {
        for (const [index, testCase] of orderedCases.entries()) {
          await transaction.runTestCase.create({
            data: {
              runId: run.id,
              testCaseId: testCase.id,
              position: index + 1,
              snapshotTitle: testCase.title,
              snapshotPreconditions: testCase.preconditions,
              snapshotSteps: serializeSteps(testCase.testSteps, testCase),
              snapshotExpectedResult: testCase.expectedResult,
              snapshotPriority: testCase.priority,
              snapshotType: testCase.type,
              snapshotSeverity: testCase.severity,
              snapshotAutomationStatus: testCase.automationStatus
            }
          });
        }
      }

      return run.id;
    });
    const run = await prisma.run.findUnique({
      where: { id: runId },
      include: {
        runTestCases: {
          orderBy: [{ position: 'asc' }, { id: 'asc' }]
        },
        planSections: {
          orderBy: [{ position: 'asc' }, { id: 'asc' }]
        },
        runConfigurations: {
          orderBy: { position: 'asc' }
        }
      }
    });

    res.status(201).json(run);
  } catch (error) {
    sendError(res, error);
  }
}

export async function getRun(req, res) {
  try {
    const id = parseId(req.params.id);

    const run = await prisma.run.findUnique({
      where: { id },
      include: {
        runTestCases: {
          include: {
            runPlanSection: true,
            dependsOnRunTestCase: {
              select: {
                id: true,
                status: true,
                snapshotTitle: true
              }
            },
            testCase: {
              include: {
                testSteps: {
                  orderBy: { position: 'asc' }
                }
              }
            }
          }
        },
        planSections: {
          orderBy: [{ position: 'asc' }, { id: 'asc' }]
        },
        runConfigurations: {
          orderBy: { position: 'asc' }
        }
      }
    });

    if (!run) {
      return res.status(404).json({ error: 'Run nao encontrado' });
    }

    const sectionPositions = new Map(
      run.planSections.map((section) => [section.id, section.position])
    );
    const orderedRunCases = [...run.runTestCases].sort((left, right) => {
      const leftSection = left.runPlanSectionId
        ? sectionPositions.get(left.runPlanSectionId)
        : 0;
      const rightSection = right.runPlanSectionId
        ? sectionPositions.get(right.runPlanSectionId)
        : 0;

      return leftSection - rightSection || left.position - right.position || left.id - right.id;
    });

    res.json({
      id: run.id,
      projectId: run.projectId,
      name: run.name,
      status: run.status,
      completedAt: run.completedAt,
      createdAt: run.createdAt,
      updatedAt: run.updatedAt,
      context: {
        ...serializeRunContext(run),
        planSections: run.planSections.map((section) => ({
          id: section.id,
          name: section.name,
          description: section.description,
          position: section.position
        }))
      },
      summary: summarizeRunItems(orderedRunCases),
      cases: orderedRunCases.map((item) => ({
        runTestCaseId: item.id,
        testCaseId: item.testCaseId,
        position: item.position,
        section: item.runPlanSection
          ? {
              id: item.runPlanSection.id,
              name: item.runPlanSection.name,
              description: item.runPlanSection.description,
              position: item.runPlanSection.position
            }
          : null,
        transitionInstructions: item.transitionInstructions,
        dependency: item.dependsOnRunTestCase
          ? {
              runTestCaseId: item.dependsOnRunTestCase.id,
              title:
                item.dependsOnRunTestCase.snapshotTitle || 'Caso anterior',
              status: item.dependsOnRunTestCase.status
            }
          : null,
        dependencyReady:
          !item.dependsOnRunTestCase ||
          item.dependsOnRunTestCase.status !== 'Untested',
        title: item.snapshotTitle || item.testCase?.title || 'Caso removido',
        preconditions: item.snapshotPreconditions ?? item.testCase?.preconditions ?? null,
        testSteps: parseSnapshotSteps(item.snapshotSteps, item.testCase),
        expectedResult:
          item.snapshotExpectedResult || item.testCase?.expectedResult || '',
        priority: item.snapshotPriority || item.testCase?.priority || 'Medium',
        type: item.snapshotType || item.testCase?.type || 'Functional',
        severity: item.snapshotSeverity || item.testCase?.severity || 'Normal',
        automationStatus:
          item.snapshotAutomationStatus || item.testCase?.automationStatus || 'Manual',
        status: item.status,
        comment: item.comment,
        actualResult: item.actualResult,
        evidence: item.evidence,
        defectLink: item.defectLink,
        executor: item.executor,
        durationSeconds: item.durationSeconds,
        executedAt: item.executedAt,
        updatedAt: item.updatedAt
      }))
    });
  } catch (error) {
    sendError(res, error);
  }
}

export async function completeRun(req, res) {
  try {
    const id = parseId(req.params.id);
    validate(completeRunSchema, req.body);

    const existingRun = await prisma.run.findUnique({
      where: { id },
      select: { id: true, status: true }
    });

    if (!existingRun) {
      return res.status(404).json({ error: 'Run nao encontrado' });
    }

    if (existingRun.status === 'Completed') {
      throw conflictError('Run ja esta concluido');
    }

    const run = await prisma.run.update({
      where: { id },
      data: {
        status: 'Completed',
        completedAt: new Date()
      }
    });

    res.json(run);
  } catch (error) {
    sendError(res, error);
  }
}

export async function updateRunCase(req, res) {
  try {
    const id = parseId(req.params.runTestCaseId, 'runTestCaseId');
    const data = validate(runCaseSchema, req.body);
    const existingRunCase = await prisma.runTestCase.findUnique({
      where: { id },
      include: {
        dependsOnRunTestCase: {
          select: {
            id: true,
            status: true,
            snapshotTitle: true
          }
        },
        run: {
          select: { status: true }
        }
      }
    });

    if (!existingRunCase) {
      return res.status(404).json({ error: 'Caso do run nao encontrado' });
    }

    if (existingRunCase.run.status === 'Completed') {
      throw conflictError('Resultados de um run concluido nao podem ser alterados');
    }

    if (
      data.status !== 'Untested' &&
      existingRunCase.dependsOnRunTestCase?.status === 'Untested'
    ) {
      throw conflictError(
        `Execute primeiro: ${
          existingRunCase.dependsOnRunTestCase.snapshotTitle || 'caso anterior'
        }`
      );
    }

    const runCase = await prisma.runTestCase.update({
      where: { id },
      data: {
        status: data.status,
        comment: data.comment,
        actualResult: data.actualResult,
        evidence: data.evidence,
        defectLink: data.defectLink,
        executor: data.executor,
        durationSeconds: data.durationSeconds,
        executedAt: data.status === 'Untested' ? null : new Date()
      }
    });

    res.json(runCase);
  } catch (error) {
    if (error.code === 'P2025') {
      error.status = 404;
      error.message = 'Caso do run nao encontrado';
    }

    sendError(res, error);
  }
}
