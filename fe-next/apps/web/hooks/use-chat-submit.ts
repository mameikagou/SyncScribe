'use client';

import { isGeneratingAtom, Message, messagesAtom } from '@/store/chat-atoms';
import { useSetAtom } from 'jotai';
import { v4 as uuidv4 } from 'uuid'; // 假设你有 uuid，或者用 Date.now().toString()

export function useChatSubmit() {
  const setMessages = useSetAtom(messagesAtom);
  const setIsGenerating = useSetAtom(isGeneratingAtom);

  /**
   * 核心发送逻辑
   * @param text 用户输入的文本
   * @param attachments 上传成功的图片 URL 列表
   */
  const submitMessage = async (text: string, attachments: string[]) => {
    // 1. 创建用户消息对象
    const userMsg: Message = {
      id: uuidv4(),
      role: 'user',
      content: text,
      attachmentUrls: attachments,
      createdAt: Date.now(),
    };

    // 2. 乐观更新 UI (立即显示用户消息)
    setMessages((prev) => [...prev, userMsg]);
    setIsGenerating(true);

    try {
      console.log('🚀 Sending to AI:', { text, attachments });

      // === 3. 模拟 API 调用 (将来在这里替换为 fetch / AI SDK) ===
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 4. 模拟 AI 回复
      const aiMsg: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: '这是一个模拟的 AI 回复。在真实场景中，这里会流式输出 Token。',
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error('发送失败:', error);
      // 这里可以添加 toast.error("发送失败")
    } finally {
      // 5. 结束加载状态
      setIsGenerating(false);
    }
  };

  return {
    submitMessage,
  };
}
