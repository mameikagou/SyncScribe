// apps/web/prisma.config.ts
import { defineConfig } from 'prisma/config';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 加载文件读取上下两层
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '.env.local') });
dotenv.config({ path: path.resolve(__dirname, './.env.local') }); // 生效的应该只是这个



// 优先使用非连接池 URL，备选 DATABASE_URL
const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_PRISMA_URL;

if (!databaseUrl) {
  throw new Error(
    'Missing database URL. Set DATABASE_URL_UNPOOLED or POSTGRES_PRISMA_URL in .env.local'
  );
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
