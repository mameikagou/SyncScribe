// apps/web/server/app.ts
import { Hono } from 'hono';
import mcpRouter from '@/server/routers/mcp';
import testRouter from '@/server/routers/test';

const app = new Hono()
  .basePath('/api')
  .route('test', testRouter)
  .route('/mcp', mcpRouter)   // 挂载 /api/mcp

export default app;
export type AppType = typeof app; // 导出类型给前端用