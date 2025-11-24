'use client';

import { useChat } from '@ai-sdk/react';
import { isGeneratingAtom, messagesAtom } from '@/store/chat-atoms';
import { useSetAtom, useAtomValue } from 'jotai';
import { v4 as uuidv4 } from 'uuid';

export function useChatSubmit() {
  // 使用 useChat hook
  const { messages: uiMessages, sendMessage, status } = useChat();

  // 获取 jotai 状态
  const setMessages = useSetAtom(messagesAtom);
  const setIsGenerating = useSetAtom(isGeneratingAtom);

  /**
   * 核心发送逻辑
   * @param text 用户输入的文本
   * @param attachments 上传成功的图片 URL 列表
   */
  const submitMessage = async (text: string, attachments: string[]) => {
    try {
      // 准备消息内容
      const messageContent = {
        text: text,
        ...(attachments.length > 0 && {
          experimental_attachments: attachments.map((url) => ({
            url,
            contentType: 'image/jpeg',
          })),
        }),
      };

      // 发送消息
      await sendMessage(messageContent);

      // 同步状态到 jotai
      setIsGenerating(status !== 'ready');

      // 转换并保存消息到 jotai
      const convertedMessages = uiMessages.map((uiMsg) => ({
        id: uiMsg.id || uuidv4(),
        role: uiMsg.role as 'user' | 'assistant' | 'system',
        content: uiMsg.parts
          .filter((part) => part.type === 'text')
          .map((part) => (part as { type: 'text'; text: string }).text)
          .join(''),
        createdAt: Date.now(),
      }));

      setMessages(convertedMessages);
    } catch (error) {
      console.error('发送失败:', error);
    }
  };

  return {
    submitMessage,
  };
}