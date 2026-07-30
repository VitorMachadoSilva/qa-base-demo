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

function dateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function daysAgo(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return dateOnly(date);
}

function mfPayload(overrides = {}) {
  return {
    type: 'MF',
    code: 'MF-001',
    sourceUrl: 'https://jira.local/browse/MF-001',
    title: 'Video nao retorna apos reconexao',
    description: 'Falha reportada em producao',
    supportContact: 'Fulano do suporte',
    qaOwner: 'QA local',
    registeredAt: daysAgo(30),
    dueDate: null,
    criticality: null,
    affectedUsersCount: null,
    validationBriefId: null,
    runId: null,
    milestoneId: null,
    linkedAdId: null,
    ...overrides
  };
}

function adPayload(overrides = {}) {
  return {
    type: 'AD',
    code: 'AD-001',
    sourceUrl: 'https://jira.local/browse/AD-001',
    title: 'Corrigir recuperacao do stream',
    description: 'Correcao definitiva da reconexao',
    supportContact: 'Fulano do suporte',
    qaOwner: 'QA local',
    registeredAt: daysAgo(12),
    dueDate: null,
    criticality: 'High',
    affectedUsersCount: 18,
    validationBriefId: null,
    runId: null,
    milestoneId: null,
    linkedAdId: null,
    ...overrides
  };
}

async function runDemandSmoke() {
  const suffix = Date.now();
  const projectIds = [];

  try {
    const project = await request('/projects', {
      method: 'POST',
      body: JSON.stringify({ name: `Demandas ${suffix}` })
    });
    const otherProject = await request('/projects', {
      method: 'POST',
      body: JSON.stringify({ name: `Demandas externo ${suffix}` })
    });
    projectIds.push(project.id, otherProject.id);

    const emptySummary = await request(
      `/projects/${otherProject.id}/production-demands/summary`
    );

    if (emptySummary.total !== 0 || emptySummary.active !== 0) {
      throw new Error('Empty demand summary is not zeroed');
    }

    const brief = await request(`/projects/${project.id}/validation-briefs`, {
      method: 'POST',
      body: JSON.stringify({
        title: 'Validar reconexao em producao',
        folderId: null,
        sourceUrl: null,
        objective: null,
        scope: null,
        generalNotes: null,
        status: 'Draft',
        criteria: [],
        checks: []
      })
    });
    const externalBrief = await request(
      `/projects/${otherProject.id}/validation-briefs`,
      {
        method: 'POST',
        body: JSON.stringify({
          title: 'Ficha de outro projeto',
          folderId: null,
          sourceUrl: null,
          objective: null,
          scope: null,
          generalNotes: null,
          status: 'Draft',
          criteria: [],
          checks: []
        })
      }
    );
    const milestone = await request(`/projects/${project.id}/milestones`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'Release de correcao',
        description: null,
        status: 'Active',
        startDate: null,
        dueDate: null
      })
    });

    const invalidUrlError = await expectError(
      `/projects/${project.id}/production-demands`,
      {
        method: 'POST',
        body: JSON.stringify(mfPayload({ sourceUrl: 'jira-sem-protocolo' }))
      }
    );
    const invalidAdError = await expectError(
      `/projects/${project.id}/production-demands`,
      {
        method: 'POST',
        body: JSON.stringify(
          adPayload({ code: 'AD-SEM-IMPACTO', criticality: null, affectedUsersCount: null })
        )
      }
    );
    const crossProjectLinkError = await expectError(
      `/projects/${project.id}/production-demands`,
      {
        method: 'POST',
        body: JSON.stringify(
          mfPayload({
            code: 'MF-EXTERNO',
            validationBriefId: externalBrief.id
          })
        )
      }
    );

    const mf = await request(`/projects/${project.id}/production-demands`, {
      method: 'POST',
      body: JSON.stringify(mfPayload({ validationBriefId: brief.id }))
    });

    if (mf.deadlineState !== 'Overdue' || mf.daysOverdue < 9) {
      throw new Error('MF calendar deadline or overdue context is incorrect');
    }

    const duplicateCodeError = await expectError(
      `/projects/${project.id}/production-demands`,
      {
        method: 'POST',
        body: JSON.stringify(mfPayload({ code: '  mf-001  ' }))
      },
      409
    );
    const ad = await request(`/projects/${project.id}/production-demands`, {
      method: 'POST',
      body: JSON.stringify(adPayload({ milestoneId: milestone.id }))
    });

    if (ad.deadlineState !== 'NoDate') {
      throw new Error('AD without date was not serialized as NoDate');
    }

    const linkedMf = await request(`/production-demands/${mf.id}`, {
      method: 'PUT',
      body: JSON.stringify(
        mfPayload({
          status: 'InProgress',
          validationBriefId: brief.id,
          linkedAdId: ad.id
        })
      )
    });

    if (linkedMf.linkedAd?.id !== ad.id) {
      throw new Error('MF was not linked to the definitive AD');
    }

    const adDetail = await request(`/production-demands/${ad.id}`);

    if (!adDetail.relatedMfs.some((item) => item.id === mf.id)) {
      throw new Error('AD does not expose its related MF');
    }

    const invalidLinkedTargetError = await expectError(
      `/production-demands/${mf.id}`,
      {
        method: 'PUT',
        body: JSON.stringify(
          mfPayload({
            status: 'InProgress',
            validationBriefId: brief.id,
            linkedAdId: mf.id
          })
        )
      }
    );
    const filtered = await request(
      `/projects/${project.id}/production-demands?type=MF&status=InProgress&qaOwner=QA&deadlineState=Overdue&q=reconexao`
    );

    if (filtered.length !== 1 || filtered[0].id !== mf.id) {
      throw new Error('Combined demand filters did not return the expected MF');
    }

    const summary = await request(`/projects/${project.id}/production-demands/summary`);

    if (
      summary.active !== 2 ||
      summary.overdue !== 1 ||
      summary.noDate !== 1 ||
      summary.highCriticality !== 1
    ) {
      throw new Error('Operational demand summary is incorrect');
    }

    const note = await request(`/production-demands/${mf.id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ content: 'Reproducao confirmada em homologacao', author: 'QA local' })
    });
    const emptyNoteError = await expectError(
      `/production-demands/${mf.id}/notes`,
      {
        method: 'POST',
        body: JSON.stringify({ content: ' ', author: null })
      }
    );
    const systemActivity = (await request(`/production-demands/${mf.id}`)).activities[0];
    const immutableActivityError = await expectError(
      `/production-demand-activities/${systemActivity.id}`,
      { method: 'DELETE' }
    );
    await request(`/production-demand-activities/${note.id}`, { method: 'DELETE' });

    const incompleteMfClosureError = await expectError(
      `/production-demands/${mf.id}/close`,
      {
        method: 'POST',
        body: JSON.stringify({
          workaroundSummary: '',
          workaroundDeliveredAt: daysAgo(1),
          closureReason: 'Paliativa entregue'
        })
      }
    );
    const closedMf = await request(`/production-demands/${mf.id}/close`, {
      method: 'POST',
      body: JSON.stringify({
        workaroundSummary: 'Reiniciar somente o servico de video',
        workaroundDeliveredAt: daysAgo(1),
        closureReason: 'Paliativa validada com o suporte'
      })
    });

    if (closedMf.status !== 'Closed' || closedMf.deadlineState !== 'Closed') {
      throw new Error('MF closure was not persisted');
    }

    const closedEditError = await expectError(`/production-demands/${mf.id}`, {
      method: 'PUT',
      body: JSON.stringify(
        mfPayload({
          status: 'Waiting',
          validationBriefId: brief.id,
          linkedAdId: ad.id
        })
      )
    });
    const closedDeleteError = await expectError(`/production-demands/${mf.id}`, {
      method: 'DELETE'
    });
    const reopenedMf = await request(`/production-demands/${mf.id}/reopen`, {
      method: 'POST',
      body: JSON.stringify({ reason: 'Paliativa apresentou regressao' })
    });

    if (
      reopenedMf.status !== 'InProgress' ||
      !reopenedMf.activities.some((activity) => activity.kind === 'Reopened')
    ) {
      throw new Error('Demand reopening did not preserve timeline context');
    }

    const incompleteAdClosureError = await expectError(
      `/production-demands/${ad.id}/close`,
      {
        method: 'POST',
        body: JSON.stringify({
          resolutionSummary: '',
          productionVersion: '1.2.3',
          productionReleasedAt: daysAgo(0),
          closureReason: 'Release publicada'
        })
      }
    );
    const closedAd = await request(`/production-demands/${ad.id}/close`, {
      method: 'POST',
      body: JSON.stringify({
        resolutionSummary: 'Recuperacao do stream corrigida',
        productionVersion: '1.2.3',
        productionReleasedAt: daysAgo(0),
        closureReason: 'Versao validada em producao'
      })
    });

    if (closedAd.status !== 'Closed' || !closedAd.productionReleasedAt) {
      throw new Error('AD production closure was not persisted');
    }

    await request(`/production-demands/${ad.id}/reopen`, {
      method: 'POST',
      body: JSON.stringify({ reason: 'Validar remocao do vinculo' })
    });
    await request(`/production-demands/${ad.id}`, { method: 'DELETE' });
    const mfAfterAdDelete = await request(`/production-demands/${mf.id}`);

    if (
      mfAfterAdDelete.linkedAd !== null ||
      !mfAfterAdDelete.activities.some(
        (activity) => activity.kind === 'LinkChanged' && activity.message.includes('AD-001')
      )
    ) {
      throw new Error('Deleted AD link did not preserve readable timeline context');
    }

    await request(`/validation-briefs/${brief.id}`, { method: 'DELETE' });
    const mfAfterBriefDelete = await request(`/production-demands/${mf.id}`);

    if (
      mfAfterBriefDelete.validationBrief !== null ||
      !mfAfterBriefDelete.activities.some(
        (activity) =>
          activity.kind === 'LinkChanged' &&
          activity.message.includes('Validar reconexao em producao')
      )
    ) {
      throw new Error('Deleted brief link did not preserve timeline context');
    }

    const ordered = await request(`/projects/${project.id}/production-demands`);

    if (ordered[0]?.id !== mf.id) {
      throw new Error('Operational ordering did not prioritize the active overdue MF');
    }

    console.log(
      JSON.stringify(
        {
          projectIsolation: true,
          mfDeadlineState: mf.deadlineState,
          adWithoutDate: ad.deadlineState,
          combinedFilters: filtered.length,
          summary,
          linkedMfVisibleFromAd: true,
          timelinePreservedAfterSourceDelete: true,
          validations: {
            invalidUrl: invalidUrlError,
            invalidAd: invalidAdError,
            crossProjectLink: crossProjectLinkError,
            duplicateCode: duplicateCodeError,
            invalidLinkedTarget: invalidLinkedTargetError,
            emptyNote: emptyNoteError,
            immutableActivity: immutableActivityError,
            incompleteMfClosure: incompleteMfClosureError,
            closedEdit: closedEditError,
            closedDelete: closedDeleteError,
            incompleteAdClosure: incompleteAdClosureError
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

runDemandSmoke().catch((error) => {
  console.error(error);
  process.exit(1);
});
