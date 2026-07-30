import { createHash } from 'node:crypto';
import { FIXED_ACCOUNTS } from '../src/auth/fixedAccounts.js';
import { prisma } from '../src/db/client.js';

const API_URL = process.env.API_URL || 'http://localhost:3001/api';
const account = FIXED_ACCOUNTS[0];
const initialPassword = process.env.QABASE_AUTH_SMOKE_PASSWORD || 'waldyr@sw123456';
const temporaryPassword = `QaBase-smoke-${Date.now()}!`;

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  const body = response.status === 204 ? null : await response.json().catch(() => ({}));
  return { response, body };
}

async function login(email, password) {
  const result = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  const cookie = result.response.headers.get('set-cookie')?.split(';')[0];
  return { ...result, cookie };
}

async function run() {
  const originalUser = await prisma.user.findUnique({
    where: { email: account.email }
  });

  if (!originalUser) {
    throw new Error('Fixed authentication smoke account is missing');
  }

  await prisma.session.deleteMany({ where: { userId: originalUser.id } });

  try {
    const anonymous = await request('/projects');
    if (anonymous.response.status !== 401) {
      throw new Error('Business API accepted an anonymous request');
    }

    const unknown = await login(`unknown-${Date.now()}@qabase.com`, 'invalid-password');
    const wrong = await login(account.email, 'invalid-password');
    if (
      unknown.response.status !== 401 ||
      wrong.response.status !== 401 ||
      unknown.body.error !== wrong.body.error
    ) {
      throw new Error('Login failure leaks account validity');
    }

    const throttleEmail = `throttle-${Date.now()}@qabase.com`;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await login(throttleEmail, 'invalid-password');
    }
    const blocked = await login(throttleEmail, 'invalid-password');
    if (blocked.response.status !== 429) {
      throw new Error('Repeated login failures were not throttled');
    }

    const authenticated = await login(account.email, initialPassword);
    const setCookie = authenticated.response.headers.get('set-cookie') || '';
    if (
      authenticated.response.status !== 200 ||
      !authenticated.cookie ||
      !setCookie.includes('HttpOnly') ||
      !setCookie.includes('SameSite=Strict') ||
      !setCookie.includes('Max-Age=604800')
    ) {
      throw new Error('Successful login did not create the expected protected session');
    }

    const session = await request('/auth/session', {
      headers: { Cookie: authenticated.cookie }
    });
    if (session.response.status !== 200 || session.body.user.email !== account.email) {
      throw new Error('Authenticated session was not restored');
    }

    const sharedProjects = await request('/projects', {
      headers: { Cookie: authenticated.cookie }
    });
    if (sharedProjects.response.status !== 200 || !Array.isArray(sharedProjects.body)) {
      throw new Error('Authenticated account cannot access shared projects');
    }

    const foreignOrigin = await request('/projects', {
      method: 'POST',
      headers: {
        Cookie: authenticated.cookie,
        Origin: 'https://invalid.example'
      },
      body: JSON.stringify({ name: 'Nao deve criar' })
    });
    if (foreignOrigin.response.status !== 403) {
      throw new Error('Cross-origin mutation was not rejected');
    }

    const notice = await request('/auth/password-notice', {
      method: 'POST',
      headers: { Cookie: authenticated.cookie }
    });
    if (notice.response.status !== 200 || !notice.body.user.passwordNoticeSeen) {
      throw new Error('Password notice acknowledgement was not persisted');
    }

    const changed = await request('/auth/password', {
      method: 'PUT',
      headers: { Cookie: authenticated.cookie },
      body: JSON.stringify({
        currentPassword: initialPassword,
        newPassword: temporaryPassword,
        confirmPassword: temporaryPassword
      })
    });
    const changedCookie = changed.response.headers.get('set-cookie')?.split(';')[0];
    if (changed.response.status !== 200 || !changedCookie) {
      throw new Error('Password change did not replace the current session');
    }

    const userSessionCount = await prisma.session.count({
      where: { userId: originalUser.id }
    });
    if (userSessionCount !== 1) {
      throw new Error('Password change did not revoke other sessions');
    }

    const oldPassword = await login(account.email, initialPassword);
    const newPassword = await login(account.email, temporaryPassword);
    if (oldPassword.response.status !== 401 || newPassword.response.status !== 200) {
      throw new Error('Password change did not update authentication credentials');
    }

    const sessionToken = newPassword.cookie.split('=')[1];
    await prisma.session.update({
      where: { tokenHash: hashToken(sessionToken) },
      data: { expiresAt: new Date(Date.now() - 1000) }
    });
    const expired = await request('/auth/session', {
      headers: { Cookie: newPassword.cookie }
    });
    if (expired.response.status !== 401) {
      throw new Error('Expired session was accepted');
    }

    const logoutLogin = await login(account.email, temporaryPassword);
    const logout = await request('/auth/logout', {
      method: 'POST',
      headers: { Cookie: logoutLogin.cookie }
    });
    const afterLogout = await request('/auth/session', {
      headers: { Cookie: logoutLogin.cookie }
    });
    if (logout.response.status !== 204 || afterLogout.response.status !== 401) {
      throw new Error('Logout did not revoke the current session');
    }

    console.log('Authentication smoke test passed.');
  } finally {
    await prisma.session.deleteMany({ where: { userId: originalUser.id } });
    await prisma.user.update({
      where: { id: originalUser.id },
      data: {
        passwordHash: account.passwordHash,
        passwordNoticeSeenAt: originalUser.passwordNoticeSeenAt
      }
    });
    await prisma.$disconnect();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
