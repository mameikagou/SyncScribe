/**
 * Endpoint Description: GET /api/test/hello，返回简单的健康检查字符串。
 * Request Example:
 * {}
 * Response Example (200):
 * {
 *   "results": "hellow, test"
 * }
 * Response Example (400):
 * {
 *   "error": "Invalid request"
 * }
 * Response Example (500):
 * {
 *   "error": "Internal server error"
 * }
 * Test Command:
 * curl -X GET http://localhost:3000/api/test/hello
 */

// apps/web/server/routers/test.ts
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
