// 连接池初始化
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client'; // 注意这里要pnpx prisma generate才能生效
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const POSTGRES_PRISMA_URL = process.env.POSTGRES_PRISMA_URL;

if (!POSTGRES_PRISMA_URL) {
  throw new Error('Missing POSTGRES_PRISMA_URL environment variable');
}

// 1. 建立 Neon 连接池
const pool = new Pool({
  connectionString: POSTGRES_PRISMA_URL,
});

// 2. 建立适配器
const adapter = new PrismaNeon(pool);

// 3. 传递 adapter 给 PrismaClient
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter, // <--- 关键：运行时不再通过 schema 读取 url，而是通过这里传递
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
