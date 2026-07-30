import '../src/config/env.js';
import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEMO_ACCOUNT_COUNT } from '../src/auth/fixedAccounts.js';
import { derivePassword } from '../src/auth/passwords.js';
import { prisma } from '../src/db/client.js';

const rootDirectory = fileURLToPath(new URL('../../', import.meta.url));
const privateDirectory = path.join(rootDirectory, 'private');
const requestedExpiration = String(
  process.env.QABASE_DEMO_ACCOUNT_EXPIRES_AT || ''
).trim();
const expiresAt = requestedExpiration ? new Date(requestedExpiration) : null;

if (expiresAt && Number.isNaN(expiresAt.getTime())) {
  throw new Error('QABASE_DEMO_ACCOUNT_EXPIRES_AT must be an ISO date.');
}

function demoEmail(position) {
  return `demo${String(position).padStart(2, '0')}@qabase.com`;
}

function temporaryPassword() {
  return `${randomBytes(12).toString('base64url')}Aa1!`;
}

const emails = Array.from(
  { length: DEMO_ACCOUNT_COUNT },
  (_, index) => demoEmail(index + 1)
);
const existing = await prisma.user.findMany({
  where: { email: { in: emails } },
  select: { email: true }
});

if (existing.length > 0) {
  throw new Error(
    `Provisioning stopped: ${existing.length} demo account(s) already exist.`
  );
}

const credentials = [];
try {
  for (let position = 1; position <= DEMO_ACCOUNT_COUNT; position += 1) {
    const email = demoEmail(position);
    const password = temporaryPassword();
    const passwordHash = await derivePassword(password);

    await prisma.user.create({
      data: {
        email,
        name: `Demo ${String(position).padStart(2, '0')}`,
        passwordHash,
        mustChangePassword: true,
        expiresAt
      }
    });
    credentials.push({ email, password });
  }

  await mkdir(privateDirectory, { recursive: true });
  const stamp = new Date().toISOString().replaceAll(':', '-');
  const outputPath = path.join(
    privateDirectory,
    `demo-credentials-${stamp}.csv`
  );
  const csv = [
    'login,password',
    ...credentials.map(({ email, password }) => `${email},${password}`)
  ].join('\n');
  await writeFile(outputPath, `${csv}\n`, { flag: 'wx', mode: 0o600 });

  console.log(`Created ${credentials.length} isolated demo accounts.`);
  console.log(`Credentials saved outside Git at ${outputPath}`);
} finally {
  await prisma.$disconnect();
}
