// apps/web/server/routers/mcp.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
// import { RagService } from '../services/rag';

const mcpRouter = new Hono()
  .post(
    '/search',
    zValidator('json', z.object({ query: z.string() })),
    async (c) => {
      const { query } = c.req.valid('json');
    //   const results = await RagService.search(query);
    return c.json({ results: [] });
    //   return c.json({ results });
    }
  );

export default mcpRouter;