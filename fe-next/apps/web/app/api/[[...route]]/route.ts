// Spec 来源：
// - specs/02-specs/vibe-repo-guide/RG-015-api-entrypoints.md
// 运行时稳定性补充：延迟加载全量 Hono app，避免可选依赖缺失时在模块求值阶段直接崩溃。

import { handle } from 'hono/vercel';

const loadMainApp = async () => {
  const mod = await import('@/server/app');
  return mod.default;
};

const toErrorResponse = (error: unknown) => {
  const detail = error instanceof Error ? error.message : String(error);
  return new Response(
    JSON.stringify({
      error: 'API bootstrap failed',
      detail,
    }),
    {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
};

export const GET = async (request: Request, _context: unknown) => {
  try {
    const app = await loadMainApp();
    return await handle(app)(request);
  } catch (error) {
    return toErrorResponse(error);
  }
};

export const POST = async (request: Request, _context: unknown) => {
  try {
    const app = await loadMainApp();
    return await handle(app)(request);
  } catch (error) {
    return toErrorResponse(error);
  }
};

export type { AppType } from '@/server/app';
