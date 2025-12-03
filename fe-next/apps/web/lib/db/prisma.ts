import { PrismaClient } from '@prisma/client';

const POSTGRES_PRISMA_URL = process.env.POSTGRES_PRISMA_URL;

if (!POSTGRES_PRISMA_URL) {
  throw new Error('Missing POSTGRES_PRISMA_URL environment variable');
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prismaClientSingleton = () => {
  return new PrismaClient({
    accelerateUrl: POSTGRES_PRISMA_URL,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
  // .$extends(withAccelerate()); // ✨ 关键：挂载加速器扩展
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma as any;
