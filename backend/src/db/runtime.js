import { prisma } from './client.js';

export async function configureDatabaseRuntime() {
  await prisma.$queryRaw`SELECT 1`;
}
