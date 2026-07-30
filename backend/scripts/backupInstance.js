import { mkdir, stat } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../src/db/client.js';
import { configureDatabaseRuntime } from '../src/db/runtime.js';

const backupRoot = resolve(process.env.QABASE_BACKUP_DIR || '/backups');
const requestedPath = process.env.QABASE_BACKUP_PATH;

if (!requestedPath) {
  throw new Error('QABASE_BACKUP_PATH is required.');
}

const backupPath = resolve(requestedPath);

if (
  dirname(backupPath) !== backupRoot ||
  extname(backupPath).toLowerCase() !== '.db'
) {
  throw new Error(`Backup path must be a .db file directly inside ${backupRoot}.`);
}

await mkdir(backupRoot, { recursive: true });

try {
  await stat(backupPath);
  throw new Error(`Backup already exists: ${backupPath}`);
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

try {
  await configureDatabaseRuntime();
  const escapedPath = backupPath.replaceAll("'", "''");
  await prisma.$executeRawUnsafe(`VACUUM INTO '${escapedPath}'`);
} finally {
  await prisma.$disconnect();
}

const backupDatabaseUrl = `file:${backupPath.replaceAll('\\', '/')}`;
const backupPrisma = new PrismaClient({
  datasources: { db: { url: backupDatabaseUrl } }
});

try {
  const result = await backupPrisma.$queryRawUnsafe('PRAGMA integrity_check');
  if (result.length !== 1 || result[0].integrity_check !== 'ok') {
    throw new Error('The generated SQLite backup failed its integrity check.');
  }
  console.log(`QaBase backup created and verified at ${backupPath}`);
} finally {
  await backupPrisma.$disconnect();
}
