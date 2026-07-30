import { PrismaClient } from '@prisma/client';
import { authenticatedFetch } from './smokeSession.js';

const API_URL = process.env.API_URL || 'http://localhost:3001/api';
const prisma = new PrismaClient();

async function request(path, options = {}) {
  const response = await authenticatedFetch(API_URL, path, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
  const body = response.status === 204 ? null : await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(body?.error || `HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return body;
}

async function expectError(path, options, status = 400) {
  try {
    await request(path, options);
  } catch (error) {
    if (error.status === status) {
      return error.message;
    }
    throw error;
  }

  throw new Error(`Expected HTTP ${status} for ${path}`);
}

async function run() {
  const suffix = Date.now();
  const createdIds = [];

  try {
    const invalidDateMessage = await expectError('/third-parties', {
      method: 'POST',
      body: JSON.stringify({
        name: `Prazo invalido ${suffix}`,
        company: 'QaBase',
        role: 'Analista',
        contact: null,
        internalOwner: 'QA local',
        notes: null,
        approvedAt: '2026-01-31',
        expiresAt: '2026-05-01',
        systems: ['Teams']
      })
    });

    if (!invalidDateMessage.includes('tres meses')) {
      throw new Error('Maximum three-month validation did not run');
    }

    const created = await request('/third-parties', {
      method: 'POST',
      body: JSON.stringify({
        name: `Terceiro ${suffix}`,
        company: 'Integradora Alfa',
        role: 'Instalador',
        contact: 'terceiro@local',
        internalOwner: 'Responsavel QA',
        notes: 'Acesso para validacao em campo.',
        approvedAt: '2026-01-31',
        expiresAt: null,
        systems: ['Teams', 'VPN', 'Jira']
      })
    });
    createdIds.push(created.id);

    if (
      created.currentCycle.expiresAt.slice(0, 10) !== '2026-04-30' ||
      created.state !== 'Expired'
    ) {
      throw new Error('Month-end clamp or derived expired state is incorrect');
    }

    const duplicateMessage = await expectError(
      '/third-parties',
      {
        method: 'POST',
        body: JSON.stringify({
          name: `  terceiro ${suffix} `,
          company: 'integradora alfa',
          role: 'Instalador',
          contact: null,
          internalOwner: 'Responsavel QA',
          notes: null,
          approvedAt: '2026-07-28',
          expiresAt: null,
          systems: ['GitLab']
        })
      },
      409
    );

    if (!duplicateMessage.includes('Ja existe')) {
      throw new Error('Normalized duplicate identity was not rejected');
    }

    const filtered = await request('/third-parties?system=VPN&state=Expired');
    if (!filtered.some((record) => record.id === created.id)) {
      throw new Error('System and state filters did not return the record');
    }

    const renewed = await request(`/third-parties/${created.id}/renew`, {
      method: 'POST',
      body: JSON.stringify({
        approvedAt: '2026-07-28',
        expiresAt: null,
        systems: ['GitLab', 'Confluence'],
        author: 'QA local'
      })
    });

    if (
      renewed.cycles.length !== 2 ||
      renewed.currentCycle.expiresAt.slice(0, 10) !== '2026-10-28' ||
      renewed.systems.join(',') !== 'Confluence,GitLab'
    ) {
      throw new Error('Renewal did not preserve history or create the expected cycle');
    }

    const activeDeleteMessage = await expectError(
      `/third-parties/${created.id}`,
      { method: 'DELETE' },
      409
    );

    if (!activeDeleteMessage.includes('Encerre os acessos')) {
      throw new Error('Open access was not protected from permanent deletion');
    }

    const note = await request(`/third-parties/${created.id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ content: 'Chamado de renovacao aprovado.', author: 'QA local' })
    });
    await request(`/third-party-access-activities/${note.id}`, { method: 'DELETE' });

    const systemActivity = renewed.activities.find((activity) => activity.kind !== 'Note');
    await expectError(
      `/third-party-access-activities/${systemActivity.id}`,
      { method: 'DELETE' },
      400
    );

    const closed = await request(`/third-parties/${created.id}/close`, {
      method: 'POST',
      body: JSON.stringify({
        reason: 'Contrato concluido',
        author: 'QA local'
      })
    });

    if (closed.state !== 'Closed' || !closed.currentCycle.closedAt) {
      throw new Error('Access closure was not reflected in the derived state');
    }

    await expectError(
      `/third-parties/${created.id}/renew`,
      {
        method: 'POST',
        body: JSON.stringify({
          approvedAt: '2026-07-28',
          expiresAt: null,
          systems: ['Teams'],
          author: null
        })
      },
      400
    );

    const summary = await request('/third-parties/summary');
    if (summary.total < 1 || summary.closed < 1) {
      throw new Error('Global summary did not include the closed record');
    }

    await request(`/third-parties/${created.id}`, { method: 'DELETE' });
    await expectError(`/third-parties/${created.id}`, {}, 404);

    const [remainingCycles, remainingActivities, summaryAfterDelete] =
      await Promise.all([
        prisma.thirdPartyAccessCycle.count({
          where: { thirdPartyId: created.id }
        }),
        prisma.thirdPartyAccessActivity.count({
          where: { thirdPartyId: created.id }
        }),
        request('/third-parties/summary')
      ]);

    if (
      remainingCycles !== 0 ||
      remainingActivities !== 0 ||
      summaryAfterDelete.total !== summary.total - 1 ||
      summaryAfterDelete.closed !== summary.closed - 1
    ) {
      throw new Error('Closed third-party cascade deletion was incomplete');
    }

    console.log('Third-party access smoke test passed.');
  } finally {
    if (createdIds.length > 0) {
      await prisma.thirdParty.deleteMany({ where: { id: { in: createdIds } } });
    }
    await prisma.$disconnect();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
