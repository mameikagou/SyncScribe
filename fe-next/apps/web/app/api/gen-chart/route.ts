/**
 * Endpoint Description: POST /api/gen-chart，基于对话生成图表描述，可能触发 generate_chart 工具调用并流式返回 AI 回复。
 * Request Example:
 * {
 *   "messages": [
 *     { "role": "user", "content": "给我一个公司收入增长趋势图" }
 *   ]
 * }
 * Response Example (200): text/event-stream，片段示例 `data: {"type":"text","content":"已生成增长趋势图数据..."}；请求体无法解析或模型异常会返回 500。
 * Test Command:
 * curl -X POST http://localhost:3000/api/gen-chart \
 *   -H "Content-Type: application/json" \
 *   -d '{"messages":[{"role":"user","content":"给我一个公司收入增长趋势图"}]}'
 */
import { deepseek } from '@/lib/ai';
import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: deepseek.chat('deepseek-chat'),
    messages,
    system:
      'You are a helpful assistant. If the user asks for a chart, call the generate_chart tool.',
    tools: {
      generate_chart: tool({
        description: 'Generates a financial growth trend chart',
        inputSchema: z.object({
          reasoning: z.string().describe('The reasoning behind the chart data'),
        }),
        execute: async () => {
          // Simulate data lookup/processing
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return {
            data: [
              { value: 10, time: 1642425322 },
              { value: 25, time: 1642511722 },
              { value: 45, time: 1642598122 },
              { value: 80, time: 1642684522 },
              { value: 150, time: 1642770922 },
              { value: 30, time: 1642857322 },
              { value: 60, time: 1642943722 },
              { value: 90, time: 1643030122 },
            ],
          };
        },
      }),
    },
  });

  return result;
}
