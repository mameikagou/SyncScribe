'use client';

import { UIMessage, useChat } from '@ai-sdk/react';
import { CrystalBar } from '@/components/CrystalBar';
import { useState, FormEvent } from 'react';

export default function AgentPage() {
  // 1. 调用 useChat hook。
  // 它会自动连接到 /api/chat，并管理所有状态
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input) return;

    sendMessage({
      text: input, // 意思是：“如果你提供了 message 对象，那你绝对不能再同时提供 text 属性。” 它是用来创建“互斥”类型的。
    });

    setInput('');
  };

  console.log('messages', messages);

  const renderMessageContent = (m: UIMessage) => {
    // 遍历消息的所有 "parts"
    return m.parts.map((part, index) => {
      // 目前，我们只渲染 "text" 类型的 part
      if (part.type === 'text') {
        return <span key={index}>{part.text}</span>;
      }
      return <span key={index}>{null}</span>;

      // (未来) 我们可以在这里渲染 "tool-call" 或 "ui" 类型的 part
      // ...
    });
  };

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto py-12">
      {/* 消息列表 (不变) */}
      <div className="flex-grow space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`p-3 rounded-lg ${m.role === 'user' ? 'bg-gray-100' : 'bg-blue-100'}`}
          >
            <span className="font-bold">{m.role === 'user' ? 'You: ' : 'DeepSeek: '}</span>
            {renderMessageContent(m)}
          </div>
        ))}
      </div>

      {/* 聊天输入表单 */}
      <form onSubmit={handleSubmit} className="flex gap-2 mt-8">
        {/* <input
          // 9. 绑定到我们自己的 useState
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="问 DeepSeek 一个问题..."
          className="flex-grow p-2 border rounded-lg focus:outline-none"
          // 10. 使用我们派生出的 isLoading 状态
          disabled={isLoading}
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-lg"
          disabled={isLoading}
        >
          Send
        </button> */}
        <CrystalBar />
      </form>
    </div>
  );
}
