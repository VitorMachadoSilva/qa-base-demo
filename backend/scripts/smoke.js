import { authenticatedFetch } from './smokeSession.js';

const baseUrl = 'http://localhost:3001/api';

async function rawRequest(path, options = {}) {
  const response = await authenticatedFetch(baseUrl, path, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  return { response, data };
}

async function request(path, options = {}) {
  const result = await rawRequest(path, options);

  if (!result.response.ok) {
    throw new Error(result.data?.error || `HTTP ${result.response.status}`);
  }

  return result.data;
}

async function expectError(path, options, expectedStatus = 400) {
  const result = await rawRequest(path, options);

  if (result.response.status !== expectedStatus) {
    throw new Error(
      `Expected HTTP ${expectedStatus} for ${path}, received ${result.response.status}`
    );
  }

  if (!result.data?.error) {
    throw new Error(`Expected a clear error message for ${path}`);
  }

  return result.data.error;
}

async function runSmokeTest() {
  const projectIds = [];

  try {
    const project = await request('/projects', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Smoke QA Manager',
        description: 'Projeto temporario de validacao'
      })
    });
    projectIds.push(project.id);

    const otherProject = await request('/projects', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Smoke Outro Projeto',
        description: 'Valida isolamento entre projetos'
      })
    });
    projectIds.push(otherProject.id);

    const emptyDashboard = await request(`/projects/${otherProject.id}/dashboard`);

    if (
      emptyDashboard.totalCases !== 0 ||
      emptyDashboard.totalRuns !== 0 ||
      emptyDashboard.lastRunSummary.completionPercentage !== 0 ||
      emptyDashboard.latestRun !== null
    ) {
      throw new Error('Empty project dashboard returned inconsistent summary data');
    }

    const rootSuite = await request(`/projects/${project.id}/suites`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'Autenticacao',
        description: 'Suite raiz'
      })
    });

    const childSuite = await request(`/projects/${project.id}/suites`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'Login web',
        description: 'Suite filha',
        parentId: rootSuite.id
      })
    });

    const otherSuite = await request(`/projects/${otherProject.id}/suites`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'Outro modulo',
        description: 'Suite de outro projeto'
      })
    });

    const cycleError = await expectError(`/suites/${rootSuite.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: rootSuite.name,
        description: rootSuite.description,
        parentId: childSuite.id
      })
    });

    const crossProjectParentError = await expectError(`/projects/${project.id}/suites`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'Suite invalida',
        parentId: otherSuite.id
      })
    });

    const invalidCaseError = await expectError(`/suites/${childSuite.id}/cases`, {
      method: 'POST',
      body: JSON.stringify({
        title: 'Caso sem passos',
        priority: 'High',
        type: 'Functional'
      })
    });

    const testCase = await request(`/suites/${childSuite.id}/cases`, {
      method: 'POST',
      body: JSON.stringify({
        title: 'Login com credenciais validas',
        preconditions: 'Usuario ativo',
        testSteps: [
          {
            action: 'Abrir a tela de login',
            expectedResult: 'Formulario de acesso e exibido'
          },
          {
            action: 'Informar credenciais validas e confirmar',
            expectedResult: 'Dashboard e exibido'
          }
        ],
        priority: 'High',
        type: 'Functional',
        severity: 'High',
        automationStatus: 'ToAutomate'
      })
    });

    const movedCase = await request(`/cases/${testCase.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: testCase.title,
        preconditions: testCase.preconditions,
        testSteps: testCase.testSteps.map((step) => ({
          action: step.action,
          expectedResult: step.expectedResult
        })),
        suiteId: rootSuite.id,
        priority: testCase.priority,
        type: testCase.type,
        severity: testCase.severity,
        automationStatus: testCase.automationStatus
      })
    });

    const searchParams = new URLSearchParams({
      q: 'credenciais',
      suiteId: String(rootSuite.id),
      priority: 'High',
      type: 'Functional',
      severity: 'High',
      automationStatus: 'ToAutomate'
    });
    const searchResults = await request(`/projects/${project.id}/cases?${searchParams}`);
    const emptyResults = await request(`/projects/${project.id}/cases?q=inexistente`);

    if (searchResults.length !== 1 || searchResults[0].id !== testCase.id) {
      throw new Error('Combined project case search and filters returned unexpected results');
    }

    if (emptyResults.length !== 0) {
      throw new Error('Case search should return an empty array when no records match');
    }

    const otherTestCase = await request(`/suites/${otherSuite.id}/cases`, {
      method: 'POST',
      body: JSON.stringify({
        title: 'Caso de outro projeto',
        steps: 'Executar uma acao externa',
        expectedResult: 'Acao externa concluida',
        priority: 'Medium',
        type: 'Functional'
      })
    });

    const validationFolder = await request(
      `/projects/${project.id}/validation-folders`,
      {
        method: 'POST',
        body: JSON.stringify({ name: 'Checkout' })
      }
    );
    const validationSubfolder = await request(
      `/projects/${project.id}/validation-folders`,
      {
        method: 'POST',
        body: JSON.stringify({
          name: 'Bugs',
          parentId: validationFolder.id
        })
      }
    );
    const otherValidationFolder = await request(
      `/projects/${otherProject.id}/validation-folders`,
      {
        method: 'POST',
        body: JSON.stringify({ name: 'Pasta externa' })
      }
    );
    const duplicateValidationFolderError = await expectError(
      `/projects/${project.id}/validation-folders`,
      {
        method: 'POST',
        body: JSON.stringify({ name: 'CHECKOUT' })
      },
      409
    );
    const validationFolderCycleError = await expectError(
      `/validation-folders/${validationFolder.id}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          name: validationFolder.name,
          parentId: validationSubfolder.id
        })
      }
    );
    const crossProjectValidationFolderError = await expectError(
      `/projects/${project.id}/validation-briefs`,
      {
        method: 'POST',
        body: JSON.stringify({
          title: 'Ficha em pasta externa',
          folderId: otherValidationFolder.id
        })
      }
    );
    const invalidValidationUrlError = await expectError(
      `/projects/${project.id}/validation-briefs`,
      {
        method: 'POST',
        body: JSON.stringify({
          title: 'Ficha com link invalido',
          sourceUrl: 'ftp://invalido.local'
        })
      }
    );
    const validationBrief = await request(
      `/projects/${project.id}/validation-briefs`,
      {
        method: 'POST',
        body: JSON.stringify({
          title: 'Validar cupom no checkout',
          folderId: validationSubfolder.id,
          sourceUrl: 'https://jira.local/browse/QAB-42',
          objective: 'Confirmar o calculo do desconto',
          scope: 'Carrinho web',
          generalNotes: 'Usar massa com dois produtos',
          status: 'InProgress',
          criteria: [{ text: 'O total reflete o desconto' }],
          checks: [
            {
              title: 'Aplicar cupom valido',
              expectedResult: 'Desconto aplicado ao total'
            }
          ]
        })
      }
    );
    const addedCriterion = await request(
      `/validation-briefs/${validationBrief.id}/criteria`,
      {
        method: 'POST',
        body: JSON.stringify({ text: 'O cupom fica visivel no resumo', position: 1 })
      }
    );
    await request(`/validation-criteria/${addedCriterion.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        text: addedCriterion.text,
        isMet: true,
        position: 2
      })
    });
    const addedValidationCheck = await request(
      `/validation-briefs/${validationBrief.id}/checks`,
      {
        method: 'POST',
        body: JSON.stringify({
          title: 'Remover cupom aplicado',
          expectedResult: 'Total original e restaurado',
          position: 1
        })
      }
    );
    await request(`/validation-checks/${addedValidationCheck.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: addedValidationCheck.title,
        expectedResult: addedValidationCheck.expectedResult,
        actualResult: 'Total restaurado sem recarregar a pagina',
        notes: 'Validado no Chrome',
        status: 'Passed',
        position: 2
      })
    });
    const validationNote = await request(
      `/validation-briefs/${validationBrief.id}/notes`,
      {
        method: 'POST',
        body: JSON.stringify({
          kind: 'Evidence',
          content: 'Comportamento confirmado na massa principal'
        })
      }
    );
    const promotion = await request(
      `/validation-checks/${addedValidationCheck.id}/promote`,
      {
        method: 'POST',
        body: JSON.stringify({
          suiteId: rootSuite.id,
          title: 'Remover cupom aplicado no checkout',
          expectedResult: addedValidationCheck.expectedResult
        })
      }
    );
    const validationList = await request(
      `/projects/${project.id}/validation-briefs?folderId=${validationSubfolder.id}&status=InProgress&q=cupom`
    );
    const validationDetail = await request(`/validation-briefs/${validationBrief.id}`);

    if (
      validationList.length !== 1 ||
      validationDetail.summary.checksTotal !== 2 ||
      validationDetail.summary.executed !== 1 ||
      validationDetail.summary.criteriaMet !== 1 ||
      validationDetail.notes[0].id !== validationNote.id ||
      validationDetail.checks.find((check) => check.id === addedValidationCheck.id)
        ?.testCase?.id !== promotion.testCase.id
    ) {
      throw new Error('Validation brief workflow returned inconsistent data');
    }

    await request(`/validation-folders/${validationFolder.id}`, { method: 'DELETE' });
    const unfiledValidationDetail = await request(
      `/validation-briefs/${validationBrief.id}`
    );

    if (unfiledValidationDetail.folderId !== null) {
      throw new Error('Deleting a validation folder did not preserve its brief as unfiled');
    }

    await request(`/cases/${promotion.testCase.id}`, { method: 'DELETE' });
    const validationAfterPromotedCaseDelete = await request(
      `/validation-briefs/${validationBrief.id}`
    );

    if (
      validationAfterPromotedCaseDelete.checks.find(
        (check) => check.id === addedValidationCheck.id
      )?.testCase !== null
    ) {
      throw new Error('Validation check did not survive deletion of its promoted case');
    }

    const emptyPlan = await request(`/projects/${project.id}/plans`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'Regressao principal',
        description: 'Plano reutilizavel',
        testCaseIds: []
      })
    });

    const duplicatePlanError = await expectError(
      `/projects/${project.id}/plans`,
      {
        method: 'POST',
        body: JSON.stringify({
          name: 'REGRESSAO PRINCIPAL',
          testCaseIds: []
        })
      },
      409
    );

    const emptyPlanRunError = await expectError(`/projects/${project.id}/runs`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'Run de plano vazio',
        testPlanId: emptyPlan.id
      })
    });

    const crossProjectPlanError = await expectError(`/plans/${emptyPlan.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: emptyPlan.name,
        description: emptyPlan.description,
        testCaseIds: [otherTestCase.id]
      })
    });

    const testPlan = await request(`/plans/${emptyPlan.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: emptyPlan.name,
        description: emptyPlan.description,
        testCaseIds: [testCase.id]
      })
    });

    if (testPlan.items.length !== 1 || testPlan.items[0].testCaseId !== testCase.id) {
      throw new Error('Test plan ordering or item replacement failed');
    }

    const invalidMilestoneDateError = await expectError(
      `/projects/${project.id}/milestones`,
      {
        method: 'POST',
        body: JSON.stringify({
          name: 'Release invalida',
          startDate: '2026-08-10',
          dueDate: '2026-08-01'
        })
      }
    );

    const milestone = await request(`/projects/${project.id}/milestones`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'Release 1.0',
        description: 'Primeira entrega',
        status: 'Active',
        startDate: '2026-08-01',
        dueDate: '2026-08-10'
      })
    });

    const duplicateMilestoneError = await expectError(
      `/projects/${project.id}/milestones`,
      {
        method: 'POST',
        body: JSON.stringify({
          name: 'RELEASE 1.0'
        })
      },
      409
    );

    const otherMilestone = await request(`/projects/${otherProject.id}/milestones`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'Release externa'
      })
    });

    const environment = await request(`/projects/${project.id}/environments`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'Homologacao',
        description: 'Ambiente de testes',
        target: 'https://homologacao.local'
      })
    });

    const duplicateEnvironmentError = await expectError(
      `/projects/${project.id}/environments`,
      {
        method: 'POST',
        body: JSON.stringify({
          name: 'HOMOLOGACAO'
        })
      },
      409
    );

    const otherEnvironment = await request(
      `/projects/${otherProject.id}/environments`,
      {
        method: 'POST',
        body: JSON.stringify({
          name: 'Ambiente externo'
        })
      }
    );

    const browserGroup = await request(
      `/projects/${project.id}/configuration-groups`,
      {
        method: 'POST',
        body: JSON.stringify({ name: 'Navegador' })
      }
    );
    const osGroup = await request(`/projects/${project.id}/configuration-groups`, {
      method: 'POST',
      body: JSON.stringify({ name: 'Sistema operacional' })
    });
    const duplicateGroupError = await expectError(
      `/projects/${project.id}/configuration-groups`,
      {
        method: 'POST',
        body: JSON.stringify({ name: 'NAVEGADOR' })
      },
      409
    );
    const chromeOption = await request(
      `/configuration-groups/${browserGroup.id}/options`,
      {
        method: 'POST',
        body: JSON.stringify({ name: 'Chrome' })
      }
    );
    const firefoxOption = await request(
      `/configuration-groups/${browserGroup.id}/options`,
      {
        method: 'POST',
        body: JSON.stringify({ name: 'Firefox' })
      }
    );
    const windowsOption = await request(`/configuration-groups/${osGroup.id}/options`, {
      method: 'POST',
      body: JSON.stringify({ name: 'Windows' })
    });
    const duplicateOptionError = await expectError(
      `/configuration-groups/${browserGroup.id}/options`,
      {
        method: 'POST',
        body: JSON.stringify({ name: 'CHROME' })
      },
      409
    );

    const emptyRunError = await expectError(`/projects/${project.id}/runs`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'Run sem casos',
        testCaseIds: []
      })
    });

    const crossProjectRunError = await expectError(`/projects/${project.id}/runs`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'Run com caso externo',
        testCaseIds: [testCase.id, otherTestCase.id]
      })
    });

    const conflictingScopeError = await expectError(`/projects/${project.id}/runs`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'Run com duas origens',
        testCaseIds: [testCase.id],
        testPlanId: testPlan.id
      })
    });

    const duplicateGroupSelectionError = await expectError(
      `/projects/${project.id}/runs`,
      {
        method: 'POST',
        body: JSON.stringify({
          name: 'Run com navegadores duplicados',
          testPlanId: testPlan.id,
          configurationOptionIds: [chromeOption.id, firefoxOption.id]
        })
      }
    );

    const crossProjectContextError = await expectError(
      `/projects/${project.id}/runs`,
      {
        method: 'POST',
        body: JSON.stringify({
          name: 'Run com contexto externo',
          testCaseIds: [testCase.id],
          milestoneId: otherMilestone.id,
          environmentId: otherEnvironment.id
        })
      }
    );

    const run = await request(`/projects/${project.id}/runs`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'Run temporario',
        testCaseIds: [testCase.id]
      })
    });

    const contextualRun = await request(`/projects/${project.id}/runs`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'Run contextualizado',
        testPlanId: testPlan.id,
        milestoneId: milestone.id,
        environmentId: environment.id,
        configurationOptionIds: [chromeOption.id, windowsOption.id]
      })
    });

    const dashboard = await request(`/projects/${project.id}/dashboard`);
    const initialRun = await request(`/runs/${run.id}`);
    const initialContextualRun = await request(`/runs/${contextualRun.id}`);
    const runTestCaseId = initialRun.cases[0].runTestCaseId;

    if (
      initialContextualRun.context.testPlan.name !== testPlan.name ||
      initialContextualRun.context.milestone.name !== milestone.name ||
      initialContextualRun.context.environment.name !== environment.name ||
      initialContextualRun.context.configurations.length !== 2
    ) {
      throw new Error('Contextual run did not preserve the selected planning context');
    }

    const filteredRuns = await request(
      `/projects/${project.id}/runs?environmentId=${environment.id}`
    );

    if (filteredRuns.length !== 1 || filteredRuns[0].id !== contextualRun.id) {
      throw new Error('Run environment filter returned unexpected records');
    }

    const milestoneWithProgress = await request(`/milestones/${milestone.id}`);

    if (milestoneWithProgress.summary.totalRuns !== 1) {
      throw new Error('Milestone progress did not include its contextual run');
    }

    await request(`/run-cases/${runTestCaseId}`, {
      method: 'PUT',
      body: JSON.stringify({
        status: 'Failed',
        actualResult: 'Acesso negado inesperadamente',
        comment: 'Falha reproduzida no smoke test',
        durationSeconds: 18
      })
    });

    await request(`/cases/${testCase.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: 'Titulo alterado depois do snapshot',
        preconditions: movedCase.preconditions,
        testSteps: movedCase.testSteps.map((step) => ({
          action: step.action,
          expectedResult: step.expectedResult
        })),
        suiteId: movedCase.suiteId,
        priority: movedCase.priority,
        type: movedCase.type,
        severity: movedCase.severity,
        automationStatus: movedCase.automationStatus
      })
    });

    await request(`/plans/${testPlan.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Plano renomeado',
        description: testPlan.description,
        testCaseIds: [testCase.id]
      })
    });
    await request(`/milestones/${milestone.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Release 1.0 renomeada',
        description: milestone.description,
        status: 'Completed',
        startDate: milestone.startDate,
        dueDate: milestone.dueDate
      })
    });
    await request(`/environments/${environment.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Homologacao nova',
        description: environment.description,
        target: 'https://novo-alvo.local'
      })
    });
    await request(`/configuration-options/${chromeOption.id}`, {
      method: 'PUT',
      body: JSON.stringify({ name: 'Chrome atual' })
    });

    const completedMilestoneRunError = await expectError(
      `/projects/${project.id}/runs`,
      {
        method: 'POST',
        body: JSON.stringify({
          name: 'Run em milestone concluido',
          testPlanId: testPlan.id,
          milestoneId: milestone.id
        })
      }
    );

    const contextualRunAfterEdits = await request(`/runs/${contextualRun.id}`);

    if (
      contextualRunAfterEdits.context.testPlan.name !== testPlan.name ||
      contextualRunAfterEdits.context.milestone.name !== milestone.name ||
      contextualRunAfterEdits.context.environment.name !== environment.name ||
      contextualRunAfterEdits.context.configurations[0].option !== chromeOption.name
    ) {
      throw new Error('Planning context snapshot changed after source edits');
    }

    const sourceDeletionPlan = await request(`/projects/${project.id}/plans`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'Plano para exclusao de caso',
        testCaseIds: [testCase.id]
      })
    });

    await request(`/plans/${testPlan.id}`, { method: 'DELETE' });
    await request(`/milestones/${milestone.id}`, { method: 'DELETE' });
    await request(`/environments/${environment.id}`, { method: 'DELETE' });
    await request(`/configuration-options/${chromeOption.id}`, { method: 'DELETE' });

    const contextualRunAfterContextDelete = await request(`/runs/${contextualRun.id}`);

    if (
      contextualRunAfterContextDelete.context.testPlan.name !== testPlan.name ||
      contextualRunAfterContextDelete.context.milestone.name !== milestone.name ||
      contextualRunAfterContextDelete.context.environment.name !== environment.name ||
      contextualRunAfterContextDelete.context.configurations[0].option !==
        chromeOption.name
    ) {
      throw new Error('Planning context snapshot was lost after source deletion');
    }

    const runAfterEdit = await request(`/runs/${run.id}`);

    if (runAfterEdit.cases[0].title !== testCase.title) {
      throw new Error('Run snapshot changed after editing the source case');
    }

    await request(`/cases/${testCase.id}`, { method: 'DELETE' });
    const runAfterDelete = await request(`/runs/${run.id}`);
    const planAfterSourceDelete = await request(`/plans/${sourceDeletionPlan.id}`);

    if (
      runAfterDelete.cases[0].title !== testCase.title ||
      runAfterDelete.cases[0].testSteps.length !== 2
    ) {
      throw new Error('Run snapshot was not preserved after deleting the source case');
    }

    if (planAfterSourceDelete.items.length !== 0) {
      throw new Error('Deleted source case was not removed from its test plan');
    }

    await request(`/runs/${run.id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'Completed' })
    });

    const completedRunError = await expectError(
      `/run-cases/${runTestCaseId}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          status: 'Passed',
          comment: 'Tentativa invalida'
        })
      },
      409
    );

    await request(`/projects/${project.id}`, { method: 'DELETE' });
    projectIds.splice(projectIds.indexOf(project.id), 1);

    const suitesAfterDelete = await request(`/projects/${project.id}/suites`);

    if (suitesAfterDelete.length !== 0) {
      throw new Error('Cascade delete failed: suites still exist after deleting project');
    }

    console.log(
      JSON.stringify(
        {
          projectId: project.id,
          rootSuiteId: rootSuite.id,
          childSuiteId: childSuite.id,
          testCaseId: testCase.id,
          movedToSuiteId: movedCase.suiteId,
          structuredSteps: movedCase.testSteps.length,
          runId: run.id,
          contextualRunId: contextualRun.id,
          planDraftCreated: emptyPlan.items.length === 0,
          planOrderingPreserved: testPlan.items[0].testCaseId === testCase.id,
          planningSnapshotSurvivedEdit:
            contextualRunAfterEdits.context.testPlan.name === testPlan.name,
          planningSnapshotSurvivedDelete:
            contextualRunAfterContextDelete.context.environment.name === environment.name,
          sourceDeletionRemovedPlanItem: planAfterSourceDelete.items.length === 0,
          milestoneRunCount: milestoneWithProgress.summary.totalRuns,
          contextFilteredRuns: filteredRuns.length,
          validationBriefId: validationBrief.id,
          validationChecks: validationDetail.summary.checksTotal,
          validationProgress: validationDetail.summary.progressPercentage,
          validationPromotionId: promotion.testCase.id,
          validationBriefPreservedAfterFolderDelete:
            unfiledValidationDetail.folderId === null,
          validationCheckPreservedAfterCaseDelete:
            validationAfterPromotedCaseDelete.checks.find(
              (check) => check.id === addedValidationCheck.id
            )?.testCase === null,
          snapshotSurvivedEdit: runAfterEdit.cases[0].title === testCase.title,
          snapshotSurvivedDelete: runAfterDelete.cases[0].title === testCase.title,
          runCompletion: runAfterDelete.summary.completionPercentage,
          totalCases: dashboard.totalCases,
          totalRuns: dashboard.totalRuns,
          searchResults: searchResults.length,
          emptyResults: emptyResults.length,
          emptyDashboard: {
            totalCases: emptyDashboard.totalCases,
            totalRuns: emptyDashboard.totalRuns,
            completionPercentage: emptyDashboard.lastRunSummary.completionPercentage
          },
          suitesAfterDelete: suitesAfterDelete.length,
          validations: {
            cycle: cycleError,
            crossProjectParent: crossProjectParentError,
            incompleteCase: invalidCaseError,
            emptyRun: emptyRunError,
            crossProjectRun: crossProjectRunError,
            completedRun: completedRunError,
            duplicatePlan: duplicatePlanError,
            emptyPlanRun: emptyPlanRunError,
            crossProjectPlan: crossProjectPlanError,
            invalidMilestoneDate: invalidMilestoneDateError,
            duplicateMilestone: duplicateMilestoneError,
            duplicateEnvironment: duplicateEnvironmentError,
            duplicateGroup: duplicateGroupError,
            duplicateOption: duplicateOptionError,
            conflictingScope: conflictingScopeError,
            duplicateGroupSelection: duplicateGroupSelectionError,
            crossProjectContext: crossProjectContextError,
            completedMilestoneRun: completedMilestoneRunError,
            duplicateValidationFolder: duplicateValidationFolderError,
            validationFolderCycle: validationFolderCycleError,
            crossProjectValidationFolder: crossProjectValidationFolderError,
            invalidValidationUrl: invalidValidationUrlError
          }
        },
        null,
        2
      )
    );
  } finally {
    for (const projectId of projectIds) {
      try {
        await request(`/projects/${projectId}`, { method: 'DELETE' });
      } catch {
        // Cleanup should not hide the original smoke failure.
      }
    }
  }
}

runSmokeTest().catch((error) => {
  console.error(error);
  process.exit(1);
});
