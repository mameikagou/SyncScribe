// apps/web/prisma.config.ts
import { defineConfig } from 'prisma/config';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 加载文件读取上下两层
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '.env.local') });
dotenv.config({ path: path.resolve(__dirname, './.env.local') }); // 生效的应该只是这个



// 优先使用非连接池 URL，备选 DATABASE_URL
const databaseUrl = process.env.POSTGRES_URL_NON_POOLING;

if (!databaseUrl) {
  throw new Error('Missing database URL. Set POSTGRES_URL_NON_POOLINGin .env.local');
}
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: databaseUrl,
  },
});
