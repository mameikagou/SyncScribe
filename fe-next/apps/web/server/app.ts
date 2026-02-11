// apps/web/server/app.ts
import { Hono } from 'hono';
import mcpRouter from '@/server/routers/mcp';
import modelBenchRouter from '@/server/routers/model-bench';
import ragRouter from '@/server/routers/rag';
import repoSkeletonRouter from '@/server/routers/repo-skeleton';
import testRouter from '@/server/routers/test';
import vibeRepoGuideRouter from '@/server/routers/vibe-repo-guide';
import werewolfRouter from '@/server/routers/werewolf';

const app = new Hono()
  .basePath('/api')
  .route('test', testRouter)
  .route('/rag', ragRouter)
  .route('/mcp', mcpRouter) // 挂载 /api/mcp
  .route('/vibe/werewolf', werewolfRouter)
  .route('/vibe/model-bench', modelBenchRouter)
  .route('/vibe/repo-guide', vibeRepoGuideRouter)
  .route('/vibe/repo-skeleton', repoSkeletonRouter);

export default app;
export type AppType = typeof app; // 导出类型给前端用
