/**
 * Endpoint Description: POST /api/mcp/search，接收 query 字段并返回检索结果占位列表。
 * Request Example:
 * {
 *   "query": "langchain 入门指南"
 * }
 * Response Example (200):
 * {
 *   "results": []
 * }
 * Response Example (400):
 * {
 *   "error": "Invalid request body"
 * }
 * Response Example (500):
 * {
 *   "error": "Internal server error"
 * }
 * Test Command:
 * curl -X POST http://localhost:3000/api/mcp/search \
 *   -H "Content-Type: application/json" \
 *   -d '{"query":"langchain 入门指南"}'
 */
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
