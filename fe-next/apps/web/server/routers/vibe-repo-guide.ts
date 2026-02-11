// Spec 来源：
// - specs/02-specs/vibe-repo-guide/RG-014-router.md

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import {
  askRepoGuideQuestion,
  createRepoGuideSessionOrchestration,
  getGuideDocOrchestration,
  getGuideManifestOrchestration,
  getRepoFileOrchestration,
  getRepoGuideStatus,
  getRepoTreeOrchestration,
  startRepoGuideIndexing,
} from '@/server/services/vibe/repo-guide/orchestrator';

const sessionSchema = z.object({
  repoUrl: z.string().trim().min(1, 'repoUrl 不能为空'),
  branch: z.string().trim().min(1).optional(),
});

const indexSchema = z.object({
  sessionId: z.string().trim().min(1, 'sessionId 不能为空'),
  force: z.boolean().optional(),
});

const statusSchema = z.object({
  sessionId: z.string().trim().min(1, 'sessionId 不能为空'),
});

const guideManifestQuerySchema = z.object({
  sessionId: z.string().trim().min(1, 'sessionId 不能为空'),
});

const guideDocQuerySchema = z.object({
  sessionId: z.string().trim().min(1, 'sessionId 不能为空'),
  docId: z.string().trim().min(1, 'docId 不能为空'),
});

const repoTreeQuerySchema = z.object({
  sessionId: z.string().trim().min(1, 'sessionId 不能为空'),
  path: z.string().trim().optional(),
});

const repoFileQuerySchema = z.object({
  sessionId: z.string().trim().min(1, 'sessionId 不能为空'),
  path: z.string().trim().min(1, 'path 不能为空'),
  startLine: z.coerce.number().int().min(1).optional(),
  endLine: z.coerce.number().int().min(1).optional(),
});

const askSchema = z.object({
  sessionId: z.string().trim().min(1, 'sessionId 不能为空'),
  question: z.string().trim().min(1, 'question 不能为空'),
  maxSteps: z.number().int().min(4).max(10).optional(),
});

const toErrorResponse = (error: unknown) => {
  return {
    error: error instanceof Error ? error.message : String(error),
  };
};

const vibeRepoGuideRouter = new Hono()
  .post('/session', zValidator('json', sessionSchema), async (c) => {
    try {
      const payload = c.req.valid('json');
      const session = await createRepoGuideSessionOrchestration(payload);
      return c.json({
        sessionId: session.sessionId,
        repoKey: session.repoKey,
        state: session.state,
        branch: session.branch,
      });
    } catch (error) {
      return c.json(toErrorResponse(error), 400);
    }
  })
  .post('/index', zValidator('json', indexSchema), async (c) => {
    try {
      const payload = c.req.valid('json');
      const result = await startRepoGuideIndexing(payload);
      return c.json(result);
    } catch (error) {
      return c.json(toErrorResponse(error), 400);
    }
  })
  .get('/status', zValidator('query', statusSchema), async (c) => {
    try {
      const { sessionId } = c.req.valid('query');
      const status = getRepoGuideStatus(sessionId);
      return c.json(status);
    } catch (error) {
      return c.json(toErrorResponse(error), 400);
    }
  })
  .get('/guide/manifest', zValidator('query', guideManifestQuerySchema), async (c) => {
    try {
      const { sessionId } = c.req.valid('query');
      const manifest = await getGuideManifestOrchestration(sessionId);
      return c.json(manifest);
    } catch (error) {
      return c.json(toErrorResponse(error), 400);
    }
  })
  .get('/guide/doc', zValidator('query', guideDocQuerySchema), async (c) => {
    try {
      const payload = c.req.valid('query');
      const doc = await getGuideDocOrchestration(payload);
      return c.json(doc);
    } catch (error) {
      return c.json(toErrorResponse(error), 400);
    }
  })
  .get('/repo/tree', zValidator('query', repoTreeQuerySchema), async (c) => {
    try {
      const payload = c.req.valid('query');
      const nodes = await getRepoTreeOrchestration(payload);
      return c.json(nodes);
    } catch (error) {
      return c.json(toErrorResponse(error), 400);
    }
  })
  .get('/repo/file', zValidator('query', repoFileQuerySchema), async (c) => {
    try {
      const payload = c.req.valid('query');
      const snapshot = await getRepoFileOrchestration(payload);
      return c.json(snapshot);
    } catch (error) {
      return c.json(toErrorResponse(error), 400);
    }
  })
  // legacy 标记：保留旧接口，方便已有 demo 继续使用。
  .post('/ask', zValidator('json', askSchema), async (c) => {
    try {
      const payload = c.req.valid('json');
      const result = await askRepoGuideQuestion(payload);
      return c.json(result);
    } catch (error) {
      return c.json(toErrorResponse(error), 400);
    }
  });

export default vibeRepoGuideRouter;
