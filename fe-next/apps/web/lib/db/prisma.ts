// 连接池初始化
// import { Pool, neonConfig } from '@neondatabase/serverless';
// import { PrismaNeon } from '@prisma/adapter-neon';
// import ws from 'ws';
import { PrismaClient } from '@prisma/client'; // 注意这里要pnpx prisma generate才能生效
import { withAccelerate } from '@prisma/extension-accelerate';

// const connectionClass = typeof ws === 'function' ? ws : (ws as any).default;

// if (!connectionClass) {
//   throw new Error('❌ Critical: Failed to load WebSocket constructor from "ws" package.');
// }

// neonConfig.webSocketConstructor = connectionClass;

// if (!PrismaClient) {
//   throw new Error('❌ Critical: Failed to load PrismaClient from "@prisma/client" package.');
// }

// const globalForPrisma = globalThis as unknown as {
//   prisma: PrismaClient | undefined;
// };

const POSTGRES_PRISMA_URL = process.env.POSTGRES_PRISMA_URL;

if (!POSTGRES_PRISMA_URL) {
  throw new Error('Missing POSTGRES_PRISMA_URL environment variable');
}

// const prismaClientSingleton = () => {
//   try {
//     const pool = new Pool({
//       connectionString: POSTGRES_PRISMA_URL,
//     });
//     const adapter = new PrismaNeon(pool);

//     return new PrismaClient({
//       adapter,
//       log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
//     });
//   } catch (e) {
//     console.error('❌ Prisma 初始化失败:', e);
//     throw e;
//   }
// };

// if (!globalForPrisma.prisma) {
//   console.log('globalForPrisma.prisma is undefined', globalForPrisma.prisma); // 第一次初始化的时候，这是符合预期的。
//   globalForPrisma.prisma = prismaClientSingleton();
// }

// // 3. 传递 adapter 给 PrismaClient
// export const prisma = globalForPrisma.prisma;

// if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

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