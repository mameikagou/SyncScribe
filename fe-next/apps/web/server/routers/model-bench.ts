import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

import { DEFAULT_MODEL_TEST_PROMPT, REGISTERED_MODELS } from '@/lib/ai-models';
import { runModelBench } from '@/server/services/vibe/model-bench';

const payloadSchema = z.object({
  prompt: z.string().max(500).optional(),
});

const modelBenchRouter = new Hono()
  .get('models', async (c) => {
    return c.json({ models: REGISTERED_MODELS });
  })
  .post('run', zValidator('json', payloadSchema), async (c) => {
    const { prompt } = c.req.valid('json');
    const result = await runModelBench(prompt ?? DEFAULT_MODEL_TEST_PROMPT);
    return c.json(result);
  });

export default modelBenchRouter;
