import { prisma } from '../db/client.js';
import { parseId, sendError } from '../utils/http.js';
import { testCaseSchema, validate } from '../validation/schemas.js';

const testCaseInclude = {
  testSteps: {
    orderBy: { position: 'asc' }
  },
  components: {
    orderBy: {
      component: {
        position: 'asc'
      }
    },
    include: {
      component: true
    }
  }
};

function validationError(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function normalizeCaseData(data) {
  const structuredSteps = data.testSteps?.length
    ? data.testSteps
    : [
        {
          action: data.steps,
          expectedResult: data.expectedResult
        }
      ];

  const legacySteps = data.testSteps?.length
    ? structuredSteps.map((step, index) => `${index + 1}. ${step.action}`).join('\n')
    : data.steps;
  const legacyExpectedResult = data.testSteps?.length
    ? structuredSteps.map((step) => step.expectedResult).join('\n')
    : data.expectedResult;

  return {
    scalar: {
      title: data.title,
      preconditions: data.preconditions,
      steps: legacySteps,
      expectedResult: legacyExpectedResult,
      priority: data.priority,
      type: data.type,
      severity: data.severity,
      automationStatus: data.automationStatus
    },
    steps: structuredSteps.map((step, index) => ({
      position: index + 1,
      action: step.action,
      expectedResult: step.expectedResult
    })),
    componentIds: data.componentIds
  };
}

function serializeTestCase(testCase) {
  return {
    ...testCase,
    components: (testCase.components || []).map((association) => association.component)
  };
}

async function getSuiteWithProject(suiteId) {
  return prisma.suite.findUnique({
    where: { id: suiteId },
    select: { id: true, projectId: true }
  });
}

async function validateComponents(projectId, componentIds) {
  if (!componentIds.length) {
    return;
  }

  const count = await prisma.testComponent.count({
    where: {
      projectId,
      id: { in: componentIds }
    }
  });

  if (count !== componentIds.length) {
    throw validationError('Um ou mais componentes nao pertencem ao projeto');
  }
}

export async function listTestCases(req, res) {
  try {
    const suiteId = parseId(req.params.suiteId, 'suiteId');

    const testCases = await prisma.testCase.findMany({
      where: { suiteId },
      orderBy: { createdAt: 'desc' },
      include: testCaseInclude
    });

    res.json(testCases.map(serializeTestCase));
  } catch (error) {
    sendError(res, error);
  }
}

export async function listProjectTestCases(req, res) {
  try {
    const projectId = parseId(req.params.projectId, 'projectId');
    const suiteId = req.query.suiteId ? parseId(req.query.suiteId, 'suiteId') : undefined;
    const componentId = req.query.componentId
      ? parseId(req.query.componentId, 'componentId')
      : undefined;
    const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    const where = {
      suite: {
        projectId,
        ...(suiteId ? { id: suiteId } : {})
      },
      ...(req.query.priority ? { priority: req.query.priority } : {}),
      ...(req.query.type ? { type: req.query.type } : {}),
      ...(req.query.severity ? { severity: req.query.severity } : {}),
      ...(req.query.automationStatus
        ? { automationStatus: req.query.automationStatus }
        : {}),
      ...(componentId
        ? {
            components: {
              some: { componentId }
            }
          }
        : {}),
      ...(query
        ? {
            OR: [
              { title: { contains: query } },
              { preconditions: { contains: query } },
              { steps: { contains: query } },
              { expectedResult: { contains: query } }
            ]
          }
        : {})
    };

    const testCases = await prisma.testCase.findMany({
      where,
      orderBy: [{ suiteId: 'asc' }, { createdAt: 'desc' }],
      include: {
        ...testCaseInclude,
        suite: {
          select: { id: true, name: true, parentId: true }
        }
      }
    });

    res.json(testCases.map(serializeTestCase));
  } catch (error) {
    sendError(res, error);
  }
}

export async function createTestCase(req, res) {
  try {
    const suiteId = parseId(req.params.suiteId, 'suiteId');
    const data = validate(testCaseSchema, req.body);
    const suite = await getSuiteWithProject(suiteId);

    if (!suite) {
      return res.status(404).json({ error: 'Suite nao encontrada' });
    }

    const normalized = normalizeCaseData(data);
    await validateComponents(suite.projectId, normalized.componentIds);
    const testCase = await prisma.testCase.create({
      data: {
        ...normalized.scalar,
        suiteId,
        testSteps: {
          create: normalized.steps
        },
        components: {
          create: normalized.componentIds.map((componentId) => ({ componentId }))
        }
      },
      include: testCaseInclude
    });

    res.status(201).json(serializeTestCase(testCase));
  } catch (error) {
    sendError(res, error);
  }
}

export async function getTestCase(req, res) {
  try {
    const id = parseId(req.params.id);
    const testCase = await prisma.testCase.findUnique({
      where: { id },
      include: {
        ...testCaseInclude,
        suite: {
          include: {
            project: true
          }
        }
      }
    });

    if (!testCase) {
      return res.status(404).json({ error: 'Caso de teste nao encontrado' });
    }

    res.json(serializeTestCase(testCase));
  } catch (error) {
    sendError(res, error);
  }
}

export async function updateTestCase(req, res) {
  try {
    const id = parseId(req.params.id);
    const data = validate(testCaseSchema, req.body);
    const existingTestCase = await prisma.testCase.findUnique({
      where: { id },
      include: {
        suite: {
          select: { projectId: true }
        }
      }
    });

    if (!existingTestCase) {
      return res.status(404).json({ error: 'Caso de teste nao encontrado' });
    }

    const targetSuiteId = data.suiteId || existingTestCase.suiteId;
    const targetSuite = await getSuiteWithProject(targetSuiteId);

    if (!targetSuite || targetSuite.projectId !== existingTestCase.suite.projectId) {
      throw validationError('O caso so pode ser movido dentro do mesmo projeto');
    }

    const normalized = normalizeCaseData(data);
    await validateComponents(existingTestCase.suite.projectId, normalized.componentIds);
    const testCase = await prisma.$transaction(async (transaction) => {
      await transaction.testStep.deleteMany({ where: { testCaseId: id } });
      await transaction.testCaseComponent.deleteMany({ where: { testCaseId: id } });

      return transaction.testCase.update({
        where: { id },
        data: {
          ...normalized.scalar,
          suiteId: targetSuiteId,
          testSteps: {
            create: normalized.steps
          },
          components: {
            create: normalized.componentIds.map((componentId) => ({ componentId }))
          }
        },
        include: testCaseInclude
      });
    });

    res.json(serializeTestCase(testCase));
  } catch (error) {
    if (error.code === 'P2025') {
      error.status = 404;
      error.message = 'Caso de teste nao encontrado';
    }

    sendError(res, error);
  }
}

export async function deleteTestCase(req, res) {
  try {
    const id = parseId(req.params.id);

    await prisma.testCase.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      error.status = 404;
      error.message = 'Caso de teste nao encontrado';
    }

    sendError(res, error);
  }
}
