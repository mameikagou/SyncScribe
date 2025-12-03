
// apps/web/server/routers/mcp.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const testRouter = new Hono()
  .get(
    'hello', // client.api.test.gello.$get();
    async (c) => {
    return c.json({ results: 'hellow, test' });
    }
  );

export default testRouter;