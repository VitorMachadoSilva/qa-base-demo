import { authenticatedFetch } from './smokeSession.js';

const API_URL = process.env.API_URL || 'http://localhost:3001/api';

async function request(path, options = {}) {
  const response = await authenticatedFetch(API_URL, path, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const error = new Error(body.error || `HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response.status === 204 ? null : response.json();
}

async function expectError(path, options, expectedStatus = 400) {
  try {
    await request(path, options);
  } catch (error) {
    if (error.status !== expectedStatus) {
      throw error;
    }
    return error.message;
  }

  throw new Error(`Expected HTTP ${expectedStatus} for ${path}`);
}

function casePayload(title, componentIds = []) {
  return {
    title,
    preconditions: 'Projeto e dispositivo preparados',
    testSteps: [
      {
        action: 'Executar a acao do cenario',
        expectedResult: 'O estado esperado e apresentado'
      }
    ],
    priority: 'High',
    type: 'Integration',
    severity: 'High',
    automationStatus: 'Manual',
    componentIds
  };
}

async function runCompositeSmoke() {
  const suffix = Date.now();
  const projectIds = [];

  try {
    const project = await request('/projects', {
      method: 'POST',
      body: JSON.stringify({ name: `Composite ${suffix}` })
    });
    const otherProject = await request('/projects', {
      method: 'POST',
      body: JSON.stringify({ name: `Composite externo ${suffix}` })
    });
    projectIds.push(project.id, otherProject.id);

    const suite = await request(`/projects/${project.id}/suites`, {
      method: 'POST',
      body: JSON.stringify({ name: 'Fluxos integrados' })
    });
    const otherSuite = await request(`/projects/${otherProject.id}/suites`, {
      method: 'POST',
      body: JSON.stringify({ name: 'Suite externa' })
    });

    const video = await request(`/projects/${project.id}/components`, {
      method: 'POST',
      body: JSON.stringify({ name: 'Video', description: 'Fluxos de video' })
    });
    const alarms = await request(`/projects/${project.id}/components`, {
      method: 'POST',
      body: JSON.stringify({ name: 'Alarmes' })
    });
    const externalComponent = await request(
      `/projects/${otherProject.id}/components`,
      {
        method: 'POST',
        body: JSON.stringify({ name: 'Externo' })
      }
    );

    const duplicateComponentError = await expectError(
      `/projects/${project.id}/components`,
      {
        method: 'POST',
        body: JSON.stringify({ name: 'video' })
      },
      409
    );

    const firstCase = await request(`/suites/${suite.id}/cases`, {
      method: 'POST',
      body: JSON.stringify(casePayload('Ativar alarme com video', [video.id, alarms.id]))
    });
    const secondCase = await request(`/suites/${suite.id}/cases`, {
      method: 'POST',
      body: JSON.stringify(casePayload('Reconectar dispositivo de video', [video.id]))
    });
    const otherCase = await request(`/suites/${otherSuite.id}/cases`, {
      method: 'POST',
      body: JSON.stringify(casePayload('Caso de outro projeto', [externalComponent.id]))
    });

    const crossProjectComponentError = await expectError(
      `/suites/${suite.id}/cases`,
      {
        method: 'POST',
        body: JSON.stringify(
          casePayload('Caso com componente externo', [externalComponent.id])
        )
      }
    );
    const filteredCases = await request(
      `/projects/${project.id}/cases?componentId=${alarms.id}&priority=High&type=Integration`
    );

    if (filteredCases.length !== 1 || filteredCases[0].id !== firstCase.id) {
      throw new Error('Component filter did not compose with metadata filters');
    }

    const planPayload = {
      name: 'Fluxo de alarme e reconexao',
      description: 'Cenario integrado com resultados independentes',
      sections: [
        {
          key: 'preparation',
          name: 'Preparacao',
          items: [
            {
              key: 'activate',
              testCaseId: firstCase.id,
              transitionInstructions: 'Mantenha o alarme ativo'
            }
          ]
        },
        {
          key: 'recovery',
          name: 'Recuperacao',
          description: 'Validar recuperacao mantendo o estado',
          items: [
            {
              key: 'reconnect',
              testCaseId: secondCase.id,
              dependsOnItemKey: 'activate'
            },
            {
              key: 'confirm',
              testCaseId: firstCase.id,
              dependsOnItemKey: 'reconnect'
            }
          ]
        }
      ]
    };
    const plan = await request(`/projects/${project.id}/plans`, {
      method: 'POST',
      body: JSON.stringify(planPayload)
    });

    if (
      plan.sections.length !== 2 ||
      plan.items.length !== 3 ||
      plan.items.filter((item) => item.testCaseId === firstCase.id).length !== 2
    ) {
      throw new Error('Composite plan hierarchy or repeated occurrence was not preserved');
    }

    const invalidDependencyError = await expectError(`/plans/${plan.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...planPayload,
        name: 'Nome que nao deve persistir',
        sections: [
          {
            key: 'invalid',
            name: 'Invalida',
            items: [
              {
                key: 'before',
                testCaseId: firstCase.id,
                dependsOnItemKey: 'after'
              },
              { key: 'after', testCaseId: secondCase.id }
            ]
          }
        ]
      })
    });
    const planAfterRollback = await request(`/plans/${plan.id}`);

    if (planAfterRollback.name !== plan.name || planAfterRollback.items.length !== 3) {
      throw new Error('Invalid plan update changed the previous hierarchy');
    }

    const crossProjectPlanError = await expectError(
      `/projects/${project.id}/plans`,
      {
        method: 'POST',
        body: JSON.stringify({
          name: 'Plano externo',
          sections: [
            {
              key: 'external',
              name: 'Externa',
              items: [{ key: 'external-case', testCaseId: otherCase.id }]
            }
          ]
        })
      }
    );

    const legacyPlan = await request(`/projects/${project.id}/plans`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'Plano legado',
        testCaseIds: [firstCase.id]
      })
    });

    if (
      legacyPlan.sections.length !== 1 ||
      legacyPlan.sections[0].name !== 'Casos do plano'
    ) {
      throw new Error('Legacy plan request did not receive a default section');
    }

    const run = await request(`/projects/${project.id}/runs`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'Execucao composta',
        testPlanId: plan.id
      })
    });
    const initialRun = await request(`/runs/${run.id}`);
    const [activateRunCase, reconnectRunCase, confirmRunCase] = initialRun.cases;

    if (
      initialRun.context.planSections.length !== 2 ||
      initialRun.cases.length !== 3 ||
      reconnectRunCase.dependency?.runTestCaseId !== activateRunCase.runTestCaseId
    ) {
      throw new Error('Composite run snapshot was not created correctly');
    }

    const dependencyLockError = await expectError(
      `/run-cases/${reconnectRunCase.runTestCaseId}`,
      {
        method: 'PUT',
        body: JSON.stringify({ status: 'Passed' })
      },
      409
    );

    await request(`/run-cases/${activateRunCase.runTestCaseId}`, {
      method: 'PUT',
      body: JSON.stringify({
        status: 'Failed',
        actualResult: 'Alarme ativou sem miniatura',
        evidence: 'evidencias/alarme-sem-miniatura.png',
        executor: 'QA local'
      })
    });
    await request(`/run-cases/${reconnectRunCase.runTestCaseId}`, {
      method: 'PUT',
      body: JSON.stringify({
        status: 'Passed',
        actualResult: 'Dispositivo reconectado'
      })
    });
    await request(`/run-cases/${confirmRunCase.runTestCaseId}`, {
      method: 'PUT',
      body: JSON.stringify({
        status: 'Blocked',
        defectLink: 'https://jira.local/browse/QA-123'
      })
    });

    await request(`/plans/${plan.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: plan.name,
        description: 'Plano alterado depois do run',
        sections: [
          {
            key: 'new',
            name: 'Estrutura nova',
            items: [{ key: 'only', testCaseId: secondCase.id }]
          }
        ]
      })
    });
    const runAfterPlanEdit = await request(`/runs/${run.id}`);

    if (
      runAfterPlanEdit.context.planSections.length !== 2 ||
      runAfterPlanEdit.cases.length !== 3 ||
      runAfterPlanEdit.cases[0].status !== 'Failed' ||
      runAfterPlanEdit.cases[2].status !== 'Blocked' ||
      runAfterPlanEdit.cases[0].evidence !== 'evidencias/alarme-sem-miniatura.png' ||
      runAfterPlanEdit.cases[2].defectLink !== 'https://jira.local/browse/QA-123'
    ) {
      throw new Error('Run occurrence results or immutable snapshot were not preserved');
    }

    await request(`/components/${alarms.id}`, { method: 'DELETE' });
    const caseAfterComponentDelete = await request(`/cases/${firstCase.id}`);

    if (
      caseAfterComponentDelete.components.some(
        (component) => component.id === alarms.id
      )
    ) {
      throw new Error('Deleting a component did not remove its case association');
    }

    console.log(
      JSON.stringify(
        {
          componentIsolation: true,
          componentFilterMatches: filteredCases.length,
          repeatedPlanOccurrences: 2,
          planSections: plan.sections.length,
          runSections: runAfterPlanEdit.context.planSections.length,
          independentResults: runAfterPlanEdit.cases.map((item) => item.status),
          snapshotPreservedAfterPlanEdit: true,
          validations: {
            duplicateComponent: duplicateComponentError,
            crossProjectComponent: crossProjectComponentError,
            invalidDependency: invalidDependencyError,
            crossProjectPlan: crossProjectPlanError,
            dependencyLock: dependencyLockError
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

runCompositeSmoke().catch((error) => {
  console.error(error);
  process.exit(1);
});
