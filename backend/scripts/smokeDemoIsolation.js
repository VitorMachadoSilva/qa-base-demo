import '../src/config/env.js';
import { derivePassword } from '../src/auth/passwords.js';
import { prisma } from '../src/db/client.js';

const apiUrl = process.env.QABASE_SMOKE_API_URL || 'http://127.0.0.1:3001/api';
const origin = new URL(apiUrl).origin;
const password = 'QaBase-Demo-Isolation-123!';
const stamp = Date.now();
const users = [
  {
    email: `isolation-a-${stamp}@qabase.test`,
    name: 'Isolation A'
  },
  {
    email: `isolation-b-${stamp}@qabase.test`,
    name: 'Isolation B'
  }
];

async function request(path, { cookie, method = 'GET', body } = {}) {
  const response = await fetch(`${apiUrl}${path}`, {
    method,
    headers: {
      ...(cookie ? { Cookie: cookie } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(method === 'GET' ? {} : { Origin: origin })
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  return { response, payload };
}

async function login(email) {
  const result = await request('/auth/login', {
    method: 'POST',
    body: { email, password }
  });
  const cookie = result.response.headers.get('set-cookie')?.split(';')[0];
  if (result.response.status !== 200 || !cookie) {
    throw new Error(`Login failed for ${email}.`);
  }
  return cookie;
}

async function expectStatus(result, status, label) {
  if (result.response.status !== status) {
    throw new Error(
      `${label}: expected ${status}, received ${result.response.status}.`
    );
  }
}

const passwordHash = await derivePassword(password);
const createdUserIds = [];

try {
  for (const user of users) {
    const created = await prisma.user.create({
      data: {
        ...user,
        passwordHash,
        mustChangePassword: false,
        passwordNoticeSeenAt: new Date()
      }
    });
    createdUserIds.push(created.id);
  }

  const [cookieA, cookieB] = await Promise.all(
    users.map((user) => login(user.email))
  );

  const projectAResult = await request('/projects', {
    cookie: cookieA,
    method: 'POST',
    body: { name: 'Projeto privado A', description: 'Isolamento' }
  });
  await expectStatus(projectAResult, 201, 'Create project A');
  const projectA = projectAResult.payload;

  const projectBResult = await request('/projects', {
    cookie: cookieB,
    method: 'POST',
    body: { name: 'Projeto privado B', description: 'Isolamento' }
  });
  await expectStatus(projectBResult, 201, 'Create project B');
  const projectB = projectBResult.payload;

  const projectsForB = await request('/projects', { cookie: cookieB });
  await expectStatus(projectsForB, 200, 'List projects B');
  if (
    projectsForB.payload.some((project) => project.id === projectA.id) ||
    !projectsForB.payload.some((project) => project.id === projectB.id)
  ) {
    throw new Error('Project list leaked data between demo accounts.');
  }

  await expectStatus(
    await request(`/projects/${projectA.id}/dashboard`, { cookie: cookieB }),
    404,
    'Cross-owner dashboard'
  );

  const noteAResult = await request('/quick-notes', {
    cookie: cookieA,
    method: 'POST',
    body: {
      title: 'Nota privada A',
      content: 'Somente a conta A pode visualizar.',
      color: 'Paper',
      pinned: false
    }
  });
  await expectStatus(noteAResult, 201, 'Create note A');

  const notesForB = await request('/quick-notes', { cookie: cookieB });
  await expectStatus(notesForB, 200, 'List notes B');
  if (notesForB.payload.some((note) => note.id === noteAResult.payload.id)) {
    throw new Error('Quick note list leaked data between demo accounts.');
  }
  await expectStatus(
    await request(`/quick-notes/${noteAResult.payload.id}`, {
      cookie: cookieB
    }),
    404,
    'Cross-owner quick note'
  );

  await expectStatus(
    await request('/notifications/overview', { cookie: cookieB }),
    404,
    'Removed Telegram module'
  );
  await expectStatus(
    await request('/third-parties', { cookie: cookieB }),
    404,
    'Removed third-party module'
  );
  await expectStatus(
    await request(`/projects/${projectB.id}/production-demands`, {
      cookie: cookieB
    }),
    404,
    'Removed AD/MF module'
  );

  console.log('Demo account isolation smoke test passed.');
} finally {
  await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  await prisma.$disconnect();
}
