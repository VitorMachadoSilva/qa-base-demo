import { PrismaClient } from '@prisma/client';

const globalDatabase = globalThis;

export const prisma =
  globalDatabase.__qabasePrisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
  });

globalDatabase.__qabasePrisma = prisma;
