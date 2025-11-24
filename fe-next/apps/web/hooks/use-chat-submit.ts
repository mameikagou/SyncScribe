'use client';

import { useChat } from '@ai-sdk/react';
import { isGeneratingAtom, Message, messagesAtom } from '@/store/chat-atoms';
import { useSetAtom, useAtomValue, useAtom } from 'jotai';
import { v4 as uuidv4 } from 'uuid';
import { useEffect } from 'react';
import { UIMessagePart } from 'ai';

export function useChatSubmit() {
  // 使用 useChat hook
  const {
    messages: sdkMessages,
    sendMessage,
    status,
    stop,
  } = useChat({
    onError: (err) => {
      console.error('AI SDK Error:', err);
    },
  });

  // 获取 jotai 状态
  const setMessages = useSetAtom(messagesAtom);
  const [isGenerating, setIsGenerating] = useAtom(isGeneratingAtom);

  useEffect(() => {
    if (!sdkMessages) return;
    const converted: Message[] = sdkMessages.map((m: any) => {
      // A. 提取文本内容
      // 遍历 parts，找到所有 type='text' 的，把它们的 text 字段拼起来
      const textContent =
        m.parts
          ?.filter((p: any) => p.type === 'text')
          .map((p: any) => p.text)
          .join('') || '';

      // B. 提取图片附件 (如果有)
      // 遍历 parts，找到 type='image' 或 'file' 的
      const attachmentUrls = m.parts
        ?.filter((p: any) => p.type === 'image' || p.type === 'file')
        .map((p: any) => p.image || p.data); // 兼容不同的字段名

      return {
        id: m.id,
        role: m.role,
        content: textContent, // 这里转回 string 给你的 UI 用
        createdAt: m.createdAt ? new Date(m.createdAt).getTime() : Date.now(),
        attachmentUrls: attachmentUrls?.length > 0 ? attachmentUrls : undefined,
      };
    });

    setMessages(converted);
  }, [sdkMessages, setMessages]);

  useEffect(() => {
    const isLoading = status !== 'ready' && status !== 'error';
    setIsGenerating(isLoading);
  }, [status, setIsGenerating]);

  /**
   * 核心发送逻辑
   * @param text 用户输入的文本
   * @param attachments 上传成功的图片 URL 列表
   */
  const submitMessage = async (text: string, attachments: string[]) => {
    if (isGenerating) return;
    if (!text.trim() && attachments.length === 0) return;

    try {
      const parts = [];

      // 添加文本 Part
      if (text.trim()) {
        parts.push({ type: 'text', text: text });
      }

      // 添加图片 Part (根据你的附件 URL)
      if (attachments.length > 0) {
        attachments.forEach((url) => {
          parts.push({ type: 'image', image: url });
        });
      }

      // 2. 构造符合 UIMessage 结构的对象
      const messagePayload = {
        id: uuidv4(),
        role: 'user',
        parts: parts, // <--- 重点在这里，传 parts 而不是 content
        createdAt: new Date(),
      };

      // @ts-ignore
      await sendMessage(messagePayload);
    } catch (error) {
      console.error('发送失败:', error);
    }
  };

  return {
    submitMessage,
    stop,
    status,
  };
}





// 分析一下useChat这钩子：
// 它内部有一个useSyncExternalStore，自己管理状态（Zustand也是基于这个库）
// 并且自己实现了一套订阅发布者模式，流式返回是这套模式一点点发回去的。
// sendMessage只是“开始发送”，刚开始的时候，它就resolve()了。然后因为没做别的（防抖节流，绑定id唯一性等等）处理，导致这个请求发了N次。
