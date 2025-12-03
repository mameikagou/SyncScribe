
// 这里放

import { z } from 'zod';
import { McpActionHandler, McpResponse, RegisteredAction } from '@/server/services/mcp/types';


// === 2. 全局注册表 ===
// 使用 Map 存储所有注册的工具，Key 是 action 名
const actionRegistry = new Map<string, RegisteredAction>();

// === 3. 注册函数 (核心) ===
/**
 * 注册一个 MCP 工具
 * @param name 工具名称 (e.g. "search_docs")
 * @param description 工具描述 (给 AI 看的)
 * @param schema Zod 参数校验
 * @param handler 执行逻辑
 */
export function registerMcpAction<T>(
  name: string,
  description: string,
  schema: z.ZodSchema<T>,
  handler: McpActionHandler<T>
) {
  if (actionRegistry.has(name)) {
    console.warn(`[MCP] Warning: Overwriting existing action "${name}"`);
  }
  actionRegistry.set(name, { name, description, schema, handler });
}

// === 4. 获取所有工具 (用于 GET /api/mcp) ===
export function getRegisteredMcpActions() {
  return Array.from(actionRegistry.values()).map(action => ({
    name: action.name,
    description: action.description,
    // 这里可以把 Zod Schema 转成 JSON Schema 给 AI 看，
    // 为了简单，暂时只返回名字和描述，或者用 zod-to-json-schema 库转换
    parameters: "See implementation" 
  }));
}

// === 5. 执行器 (核心) ===
export async function executeMcpAction(
  actionName: string,
  rawPayload: any,
  context: { requestId?: string; meta?: any }
): Promise<McpResponse> {
  const action = actionRegistry.get(actionName);

  if (!action) {
    return {
      success: false,
      error: `Unknown action: "${actionName}". Available actions: ${Array.from(actionRegistry.keys()).join(', ')}`
    };
  }

  try {
    // A. 参数校验
    const parseResult = action.schema.safeParse(rawPayload);
    if (!parseResult.success) {
      return {
        success: false,
        error: `Invalid parameters for "${actionName}": ${parseResult.error.message}`
      };
    }

    // B. 执行业务逻辑
    console.log(`[MCP] Executing "${actionName}"`, { payload: parseResult.data });
    const result = await action.handler(parseResult.data, context);

    // C. 返回成功
    return {
      success: true,
      result
    };

  } catch (error: any) {
    console.error(`[MCP] Error executing "${actionName}":`, error);
    return {
      success: false,
      error: error.message || 'Internal execution error'
    };
  }
}