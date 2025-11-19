'use client';

import { useRef, useEffect, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { ChatInput } from '@/components/ChatInput'; // 注意：根据目录结构调整相对路径

export function ChatView() {
  const [input, setInput] = useState('');

  // 2. 初始化 useChat
  const {
    messages,
    status,
    sendMessage, // v5 使用 sendMessage 发送新消息
    stop,
  } = useChat({
    // transport: {
    //   api: '/api/chat',
    // },
    onError: (error) => {
      console.error('Chat error:', error);
    },
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isLoading = status === 'submitted' || status === 'streaming';

  const handleSendMessage = async (e: any, attachmentUrls: string[]) => {
    e?.preventDefault();

    if (!input.trim() && (!attachmentUrls || attachmentUrls.length === 0)) return;

    await sendMessage({
      text: input,
      files: attachmentUrls?.map((url) => ({
        type: 'file', // 固定值
        url: url, // 图片地址
        mediaType: 'image/*', // 必须字段 (FileUIPart 要求)
      })),
    });

    setInput('');
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto h-[calc(100vh-60px)]">
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col gap-2 ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <span className="text-xs text-gray-400 px-1">{m.role === 'user' ? 'You' : 'AI'}</span>

            <div
              className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-100 text-gray-800'
              }`}
            >
              {/* Vercel AI SDK v5 标准渲染方式：只遍历 parts */}
              <div className="flex flex-col gap-2">
                {m.parts.map((part, i) => {
                  // 1. 文本内容
                  if (part.type === 'text') {
                    return (
                      <div key={i} className="whitespace-pre-wrap text-sm leading-7">
                        {part.text}
                      </div>
                    );
                  }

                  // 2. 文件/图片内容
                  if (part.type === 'file') {
                    return (
                      <div key={i} className="mb-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={part.url}
                          alt="attachment"
                          className="max-w-[200px] max-h-[200px] rounded-lg border border-gray-200 bg-white object-cover shadow-sm"
                        />
                      </div>
                    );
                  }

                  // 3. 推理内容 (Reasoning) - Deepseek 等推理模型可能会返回这个
                  if (part.type === 'reasoning') {
                    return (
                      <div
                        key={i}
                        className="text-xs text-gray-500 border-l-2 border-gray-300 pl-2 italic mb-2"
                      >
                        Thinking: {part.text}
                      </div>
                    );
                  }

                  // 4. 工具调用 (Tool Invocation) - 暂时忽略或后续添加
                  return null;
                })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 pb-8 bg-white/80 backdrop-blur-sm sticky bottom-0 z-10">
        <ChatInput
          input={input}
          setInput={setInput}
          onSubmit={handleSendMessage}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
