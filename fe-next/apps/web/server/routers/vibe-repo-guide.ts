import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import {
  askRepoGuideQuestion,
  createRepoGuideSessionOrchestration,
  getRepoGuideStatus,
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

const statusQuerySchema = z.object({
  sessionId: z.string().trim().min(1, 'sessionId 不能为空'),
});

const askSchema = z.object({
  sessionId: z.string().trim().min(1, 'sessionId 不能为空'),
  question: z.string().trim().min(1, 'question 不能为空'),
  maxSteps: z.number().int().min(4).max(10).optional(),
});

const vibeRepoGuideRouter = new Hono()
  .post('session', zValidator('json', sessionSchema), async (c) => {
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
      return c.json(
        {
          error: error instanceof Error ? error.message : String(error),
        },
        400,
      );
    }
  })
  .post('index', zValidator('json', indexSchema), async (c) => {
    try {
      const payload = c.req.valid('json');
      const result = await startRepoGuideIndexing(payload);
      return c.json(result);
    } catch (error) {
      return c.json(
        {
          error: error instanceof Error ? error.message : String(error),
        },
        400,
      );
    }
  })
  .get('status', zValidator('query', statusQuerySchema), async (c) => {
    try {
      const { sessionId } = c.req.valid('query');
      const status = getRepoGuideStatus(sessionId);
      return c.json(status);
    } catch (error) {
      return c.json(
        {
          error: error instanceof Error ? error.message : String(error),
        },
        400,
      );
    }
  })
  .post('ask', zValidator('json', askSchema), async (c) => {
    try {
      const payload = c.req.valid('json');
      const result = await askRepoGuideQuestion(payload);
      return c.json(result);
    } catch (error) {
      return c.json(
        {
          error: error instanceof Error ? error.message : String(error),
        },
        400,
      );
    }
  });

export default vibeRepoGuideRouter;
