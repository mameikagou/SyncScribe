import { registerMcpAction } from '@/lib/mcp';
import { z } from 'zod';
import { retrieveContext } from '@/lib/ai/rag'; // 假设你有这个 RAG 函数

// --- 初始化所有 Actions ---
// 这个函数需要在 API Route 顶部调用一次，或者利用文件副作用自动执行
export function initMcpActions() {
  
  // 1. 注册文档搜索工具
  registerMcpAction(
    'search_knowledge_base',
    '从本地知识库中检索文档片段 (RAG)',
    z.object({
      query: z.string().describe('搜索关键词或问题'),
      limit: z.number().optional().default(5),
    }),
    async ({ query, limit }) => {
      // 调用你的 RAG 逻辑
      const results = await retrieveContext(query, limit);
      return {
        count: results.length,
        items: results.map(r => ({
          content: r.content,
          source: r.fileName
        }))
      };
    }
  );

  // 2. 注册一个简单的计算器 (测试用)
  registerMcpAction(
    'add',
    '计算两个数字之和',
    z.object({ a: z.number(), b: z.number() }),
    async ({ a, b }) => {
      return { sum: a + b };
    }
  );
  
  console.log("✅ MCP Actions Initialized");
}