/**
 * Endpoint Description: POST /api/vibe/slidev，根据 prompt 或 messages 生成 slidev 风格的 Markdown 并以流式文本返回。
 * Request Example:
 * { "prompt": "生成一份 AI 应用趋势的 3 页 PPT" }
 * Response Example (200): text/event-stream，片段示例 `data: {"type":"text","content":"---\\nlayout: cover\\n# AI 应用趋势..."}`；模型调用失败会返回 500。
 * Test Command:
 * curl -X POST http://localhost:3000/api/vibe/slidev \
 *   -H "Content-Type: application/json" \
 *   -d '{"prompt":"生成一份 AI 应用趋势的 3 页 PPT"}'
 */
import { streamText } from 'ai';
import { deepseek } from '@/lib/ai';

export const runtime = 'edge';

type ChatMessage = {
  role: string;
  parts?: { type: string; text?: string }[];
};

const systemPrompt = `
你是一个 slidev 风格的 PPT 生成器。
规则：
- 每一页用三条横杠 --- 分隔。
- 每页顶部使用 layout 字段，取值 cover | two-cols | default。
- 内容用 Markdown，保持中文，避免长篇大段。
- 尽量给 two-cols 页增加 ::right:: 分隔，右侧可放要点/组件占位符。
- 不要输出任何额外说明。
`;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    prompt?: string;
    messages?: ChatMessage[];
  };
  const { messages = [], prompt: promptFromBody } = body;

  const lastUser = [...(messages ?? [])].reverse().find((m) => m.role === 'user');
  const promptFromMessages =
    lastUser?.parts
      ?.filter((p) => p.type === 'text' && p.text)
      .map((p) => p.text)
      .join('')
      .trim() || '';

  const prompt = promptFromMessages || promptFromBody || '流式 PPT 示例';

  const result = await streamText({
    model: deepseek.chat('deepseek-chat'), // 就应该用deepseek.chat() !!!!
    system: systemPrompt,
    prompt: `请围绕主题「${prompt}」生成 3 页 slidev Markdown。`,
  });
  // 当前 AI SDK 版本仅暴露 toTextStreamResponse，前端需配合 TextStreamChatTransport
  return result.toTextStreamResponse();
}
