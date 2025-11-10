import { convertToModelMessages, ModelMessage, streamText } from 'ai';
import { deepseek } from '@/lib/ai';

export const runtime = 'edge';
export async function POST(req: Request) {
  const { messages } = await req.json();

  // 我们将 UIMessage 数组转换为 AI SDK 核心的 CoreMessage 数组
  // (类型是 { role: 'user' | 'assistant', content: string })
  //   使用自带的函数直接转换
  const convertedMessages: ModelMessage[] = convertToModelMessages(messages);

  const result = await streamText({
    // 8. 传入模型和转换后的消息
    model: deepseek.chat('deepseek-chat'), // 选中实例中的聊天模型
    messages: convertedMessages,
  });

  return result.toUIMessageStreamResponse();
}
