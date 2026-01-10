/**
 * Endpoint Description: GET/POST /api/* 由 Hono 应用统一处理，包含示例路由 /api/test/hello (GET) 与 /api/mcp/search (POST)。
 * Request Example:
 *   GET /api/test/hello
 *   POST /api/mcp/search -> { "query": "大模型能搜些什么？" }
 * Response Example (200): { "results": "hellow, test" } 或 { "results": [] }；Zod 校验失败会返回 400，未知路径返回 404。
 * Test Command:
 * curl http://localhost:3000/api/test/hello
 * curl -X POST http://localhost:3000/api/mcp/search -H "Content-Type: application/json" -d '{"query":"大模型能搜些什么？"}'
 */
import { handle } from 'hono/vercel';
import app from '@/server/app'; 


export const GET = handle(app);
export const POST = handle(app);

// ✨✨✨ 4. 关键一步：导出类型定义！
// 这行代码把后端的整个路由结构、参数类型、返回值类型都“打包”了
export type { AppType } from '@/server/app';
