

import { z } from 'zod';

// 基础的 MCP 请求信封
export interface McpRequestEnvelope {
  requestId?: string;
  action: string;      // 工具名称，如 "search_docs"
  payload?: any;       // 工具参数，如 { query: "Next.js" }
  meta?: Record<string, any>;
}

// 统一的响应格式
export interface McpResponse {
  success: boolean;
  result?: any;
  error?: string;
  meta?: Record<string, any>;
}

// 工具函数的定义类型
// T 是 Zod Schema 推导出来的参数类型
export type McpActionHandler<T = any> = (
  params: T, 
  context?: { requestId?: string; meta?: any }
) => Promise<any>;

// 注册表中的一项
export interface RegisteredAction {
  name: string;
  description: string;
  schema: z.ZodSchema<any>; // 参数校验 Schema
  handler: McpActionHandler;
}
