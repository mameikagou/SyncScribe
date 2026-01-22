// apps/web/server/app.ts
import { Hono } from 'hono';
import mcpRouter from '@/server/routers/mcp';
import ragRouter from '@/server/routers/rag';
import testRouter from '@/server/routers/test';
import werewolfRouter from '@/server/routers/werewolf';
import modelBenchRouter from '@/server/routers/model-bench';

const app = new Hono()
  .basePath('/api')
  .route('test', testRouter)
  .route('/rag', ragRouter)
  .route('/mcp', mcpRouter)   // 挂载 /api/mcp
  .route('/vibe/werewolf', werewolfRouter)
  .route('/vibe/model-bench', modelBenchRouter)

export default app;
export type AppType = typeof app; // 导出类型给前端用
