/**
 * Endpoint Description: POST /api/chat，转发用户消息并流式返回 DeepSeek 回复；图片会先送到 Python 服务做情感分析并作为系统上下文。
 * Request Example:
 * {
 *   "messages": [
 *     {
 *       "role": "user",
 *       "content": "请结合图片给结论",
 *       "experimental_attachments": [{"url": "https://example.com/ad.png"}]
 *     }
 *   ]
 * }
 * Response Example (200): text/event-stream，片段示例 `data: {"type":"text","content":"分析结果..."}`；Invalid request 时返回 400，Python 服务或 LLM 异常会返回 500。
 * Test Command:
 * curl -X POST http://localhost:3000/api/chat \
 *   -H "Content-Type: application/json" \
 *   -d '{"messages":[{"role":"user","content":"请结合图片给结论","experimental_attachments":[{"url":"https://example.com/ad.png"}]}]}'
 */
import { convertToModelMessages, ModelMessage, streamText } from 'ai';
import { deepseek } from '@/lib/ai';

export const runtime = 'edge';

// 2. Python 服务的地址 (本地开发)
const PYTHON_SERVICE_URL = 'http://127.0.0.1:8089/api/analyze/sentiment';

export async function POST(req: Request) {
  const { messages } = await req.json();

  // 找出最后一条用户消息
  const lastUserMessage = messages[messages.length - 1];

  // 检查是否为多模态请求 (即包含图片)
  const hasImages =
    lastUserMessage?.experimental_attachments != null &&
    lastUserMessage.experimental_attachments.length > 0;

  // 定义一个变量来存储额外的上下文信息
  let analysisContext = '';

  if (hasImages) {
    try {
      console.log('检测到图片，转发到 Python 微服务...');

      const imageUrls = lastUserMessage.experimental_attachments.map((att: any) => att.url);

      const payload = {
        text: lastUserMessage.content,
        image_urls: imageUrls,
      };
      // 6. 直接调用 Python FastAPI
      const response = await fetch(PYTHON_SERVICE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Python service failed: ${response.statusText}`);
      }

      const json = await response.json();

      console.log('Python Analysis Result:', json);

      analysisContext = `
        [系统提示：这是对用户上传图片的视觉分析结果，请基于此结果回答用户的问题]
        ${JSON.stringify(json, null, 2)}
        `;
    } catch (e) {
      console.error(e);
    }
  }

  console.log('Received messages:', messages);
  if (!messages) {
    console.error('Messages is undefined!');
    return new Response('Invalid request format', { status: 400 });
  }

  // 我们将 UIMessage 数组转换为 AI SDK 核心的 CoreMessage 数组
  // (类型是 { role: 'user' | 'assistant', content: string })
  //   使用自带的函数直接转换
  const convertedMessages: ModelMessage[] = convertToModelMessages(messages);

  // 如果有分析结果，将其插入到消息队列末尾（作为 System 或 Assistant 补充信息）
  // 这里我们选择将其追加到最后一条用户消息之后，或者作为一个临时系统消息
  if (analysisContext) {
    convertedMessages.push({
      role: 'system',
      content: analysisContext,
    });
  }

  const result = await streamText({
    // 8. 传入模型和转换后的消息
    model: deepseek.chat('deepseek-chat'), // 选中实例中的聊天模型
    messages: convertedMessages,
  });

  return result.toUIMessageStreamResponse();
}
