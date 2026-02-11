// Spec 来源：
// - specs/02-specs/vibe-repo-guide/RG-015-api-entrypoints.md
// 运行时稳定性补充：将 Repo Guide API 与其他可选依赖路由隔离，避免启动时被连带击穿。

import { Hono } from 'hono';
import vibeRepoGuideRouter from '@/server/routers/vibe-repo-guide';

const repoGuideApp = new Hono().basePath('/api/vibe/repo-guide').route('/', vibeRepoGuideRouter);

export default repoGuideApp;
export type RepoGuideAppType = typeof repoGuideApp;
