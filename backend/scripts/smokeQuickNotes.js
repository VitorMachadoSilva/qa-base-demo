import { PrismaClient } from '@prisma/client';
import {
  authenticatedFetch,
  authenticatedFetchAs
} from './smokeSession.js';

const API_URL = process.env.API_URL || 'http://localhost:3001/api';
const prisma = new PrismaClient();

async function rawRequest(path, options = {}) {
  const response = await authenticatedFetch(API_URL, path, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
  const body = response.status === 204 ? null : await response.json().catch(() => ({}));

  return { response, body };
}

async function request(path, options = {}) {
  const result = await rawRequest(path, options);

  if (!result.response.ok) {
    const error = new Error(result.body?.error || `HTTP ${result.response.status}`);
    error.status = result.response.status;
    throw error;
  }

  return result.body;
}

async function expectError(path, options, expectedStatus = 400) {
  const result = await rawRequest(path, options);

  if (result.response.status !== expectedStatus || !result.body?.error) {
    throw new Error(
      `Expected HTTP ${expectedStatus} with an error message for ${path}, received ${result.response.status}`
    );
  }

  return result.body.error;
}

async function otherUserRawRequest(path, options = {}) {
  const response = await authenticatedFetchAs(
    API_URL,
    path,
    {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    },
    {
      email: 'walissom.correa@qabase.com',
      password: 'walissom@sw123456'
    }
  );
  const body = response.status === 204 ? null : await response.json().catch(() => ({}));
  return { response, body };
}

async function otherUserRequest(path, options = {}) {
  const result = await otherUserRawRequest(path, options);

  if (!result.response.ok) {
    const error = new Error(result.body?.error || `HTTP ${result.response.status}`);
    error.status = result.response.status;
    throw error;
  }

  return result.body;
}

async function expectOtherUserError(path, options, expectedStatus) {
  const result = await otherUserRawRequest(path, options);

  if (result.response.status !== expectedStatus || !result.body?.error) {
    throw new Error(
      `Expected other user HTTP ${expectedStatus} for ${path}, received ${result.response.status}`
    );
  }
}

function previousDay(day) {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

async function run() {
  const suffix = Date.now();
  const marker = `quick-note-${suffix}`;
  const createdIds = [];

  try {
    const initialSummary = await request('/quick-notes/days');

    await expectError('/quick-notes', {
      method: 'POST',
      body: JSON.stringify({ content: '   ' })
    });

    await expectError('/quick-notes', {
      method: 'POST',
      body: JSON.stringify({
        content: marker,
        color: 'Ultraviolet',
        pinned: false
      })
    });

    const plain = await request('/quick-notes', {
      method: 'POST',
      body: JSON.stringify({
        content: `${marker} captura sem titulo`
      })
    });
    createdIds.push(plain.id);

    const otherSearch = await otherUserRequest(
      `/quick-notes?q=${encodeURIComponent(marker)}`
    );
    if (otherSearch.length !== 0) {
      throw new Error('Another user can see the first user quick note');
    }

    await expectOtherUserError(`/quick-notes/${plain.id}`, {}, 404);
    await expectOtherUserError(
      `/quick-notes/${plain.id}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          title: 'Acesso indevido',
          content: marker,
          color: 'Paper',
          pinned: false
        })
      },
      404
    );
    await expectOtherUserError(
      `/quick-notes/${plain.id}`,
      { method: 'DELETE' },
      404
    );

    const otherNote = await otherUserRequest('/quick-notes', {
      method: 'POST',
      body: JSON.stringify({
        content: `${marker} nota de outro proprietario`,
        color: 'Lemon',
        pinned: false
      })
    });
    createdIds.push(otherNote.id);
    await expectError(`/quick-notes/${otherNote.id}`, {}, 404);

    if (
      plain.title !== null ||
      plain.color !== 'Paper' ||
      plain.pinned !== false ||
      plain.createdDay !== initialSummary.today
    ) {
      throw new Error('Quick-note defaults or configured civil day are incorrect');
    }

    const pinned = await request('/quick-notes', {
      method: 'POST',
      body: JSON.stringify({
        title: `Fixada ${suffix}`,
        content: `${marker} item prioritario`,
        color: 'Sky',
        pinned: true
      })
    });
    createdIds.push(pinned.id);

    const older = await request('/quick-notes', {
      method: 'POST',
      body: JSON.stringify({
        title: `Anterior ${suffix}`,
        content: `${marker} recuperacao entre dias`,
        color: 'Coral',
        pinned: false
      })
    });
    createdIds.push(older.id);

    const olderDay = previousDay(initialSummary.today);
    await prisma.quickNote.update({
      where: { id: older.id },
      data: { createdDay: olderDay }
    });

    const todayNotes = await request(`/quick-notes?day=${initialSummary.today}`);
    if (
      !todayNotes.some((note) => note.id === plain.id) ||
      !todayNotes.some((note) => note.id === pinned.id) ||
      todayNotes.some((note) => note.id === older.id)
    ) {
      throw new Error('Date-folder filtering returned inconsistent notes');
    }

    const searchResults = await request(`/quick-notes?q=${encodeURIComponent(marker)}`);
    if (
      searchResults.length !== 3 ||
      searchResults[0].id !== pinned.id ||
      !searchResults.some((note) => note.id === older.id)
    ) {
      throw new Error('Global search or pinned-first ordering is incorrect');
    }

    const updatedPlain = await request(`/quick-notes/${plain.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: `Revisada ${suffix}`,
        content: `${marker} conteudo atualizado`,
        color: 'Mint',
        pinned: true
      })
    });

    if (
      updatedPlain.createdDay !== initialSummary.today ||
      updatedPlain.color !== 'Mint' ||
      !updatedPlain.pinned ||
      updatedPlain.updatedAt === plain.updatedAt
    ) {
      throw new Error('Edit, palette, pin, or update timestamp is incorrect');
    }

    const updatedOlder = await request(`/quick-notes/${older.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: older.title,
        content: `${marker} continua no dia original`,
        color: 'Rose',
        pinned: false
      })
    });

    if (updatedOlder.createdDay !== olderDay) {
      throw new Error('Editing moved a note out of its immutable creation day');
    }

    const detail = await request(`/quick-notes/${older.id}`);
    if (detail.id !== older.id || detail.color !== 'Rose') {
      throw new Error('Quick-note detail did not return the updated record');
    }

    const summary = await request('/quick-notes/days');
    const olderFolder = summary.days.find((item) => item.day === olderDay);
    if (
      summary.total !== initialSummary.total + 3 ||
      !olderFolder ||
      olderFolder.count < 1
    ) {
      throw new Error('Date-folder summaries or total counts are incorrect');
    }

    await request(`/quick-notes/${plain.id}`, { method: 'DELETE' });
    createdIds.splice(createdIds.indexOf(plain.id), 1);
    await expectError(`/quick-notes/${plain.id}`, {}, 404);

    console.log('Quick-notes smoke test passed.');
  } finally {
    if (createdIds.length > 0) {
      await prisma.quickNote.deleteMany({ where: { id: { in: createdIds } } });
    }
    await prisma.$disconnect();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
