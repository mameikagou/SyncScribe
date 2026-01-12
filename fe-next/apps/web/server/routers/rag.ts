/**
 * Endpoint Description: POST /api/rag/retrieve —— 使用向量召回检索相似内容；POST /api/rag/recall —— 返回精简的内容预览与相似度。
 * Request Example:
 * {
 *   "query": "博格公式",
 *   "limit": 5
 * }
 * Response Example (200) for /retrieve:
 * {
 *   "results": [
 *     {
 *       "embeddingId": "emb_123",
 *       "content": "……原文片段……",
 *       "resourceId": "res_1",
 *       "fileName": "document.txt",
 *       "fileType": "text/plain",
 *       "pageNumber": 1,
 *       "chunkIndex": 0,
 *       "category": "text",
 *       "layoutInfo": null,
 *       "resourceMetadata": {},
 *       "createdAt": "2024-01-01T00:00:00.000Z",
 *       "distance": 0.12,
 *       "similarity": 0.88
 *     }
 *   ]
 * }
 * Response Example (200) for /recall:
 * {
 *   "results": [
 *     {
 *       "embeddingId": "emb_123",
 *       "similarity": 0.88,
 *       "contentPreview": "……原文片段……",
 *       "fileName": "document.txt",
 *       "resourceId": "res_1"
 *     }
 *   ]
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
 * curl -X POST http://localhost:3000/api/rag/retrieve \
 *   -H "Content-Type: application/json" \
 *   -d '{"query":"博格公式","limit":3}'
 */
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { runRecallWorkflow, runRetrieveWorkflow } from '@/server/workflows/rag';

const payloadSchema = z.object({
  query: z.string().trim().min(1, 'query 不能为空'),
  limit: z.number().int().min(1).max(50).optional(),
});

const ragRouter = new Hono()
  .post('/retrieve', zValidator('json', payloadSchema), async (c) => {
    try {
      const { query, limit } = c.req.valid('json');
      const results = await runRetrieveWorkflow({ query, limit });
      return c.json({ results });
    } catch (error) {
      console.error('retrieve error', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  })
  .post('/recall', zValidator('json', payloadSchema), async (c) => {
    try {
      const { query, limit } = c.req.valid('json');
      const results = await runRecallWorkflow({ query, limit });
      return c.json({ results });
    } catch (error) {
      console.error('recall error', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

export default ragRouter;
