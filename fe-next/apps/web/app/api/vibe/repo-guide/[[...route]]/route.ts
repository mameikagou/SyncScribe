// Spec 来源：
// - specs/02-specs/vibe-repo-guide/RG-015-api-entrypoints.md
// 运行时稳定性补充：Repo Guide 专属入口，避免被全量 API 路由依赖拖垮。

import { handle } from 'hono/vercel';
import repoGuideApp from '@/server/app-repo-guide';

export const GET = handle(repoGuideApp);
export const POST = handle(repoGuideApp);

export type { RepoGuideAppType } from '@/server/app-repo-guide';
