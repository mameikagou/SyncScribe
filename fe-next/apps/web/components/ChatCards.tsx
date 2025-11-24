'use client';
import React from 'react';
import { Bot, User, Lightbulb } from 'lucide-react';
import { Message, Messages } from '@/store/chat-atoms';

interface ChatBubbleProps {
  message: Message;
}
export const ChatCard: React.FC<ChatBubbleProps> = ({ message }) => {
  if (!message) {
    return null;
  }
  const { role = 'user', content, concepts } = message;
  if (role === 'user') {
    return (
      <div className="group">
        {/* 用户头像和信息 */}
        <div className="flex items-center gap-2 mb-2 justify-end">
          <span className="text-xs text-ink-muted font-medium font-sans">You</span>
          <div className="w-5 h-5 rounded bg-sidebar border border-ink-faint flex items-center justify-center text-ink-muted">
            <User className="w-3 h-3" />
          </div>
        </div>

        {/* 用户消息卡片 - 右侧对齐 */}
        <div className="bg-paper border border-ink-faint shadow-card rounded-lg p-4 hover:border-action/50 transition-all duration-300 cursor-default ml-8">
          <p className="text-sm text-ink leading-relaxed font-serif">{content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="group">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-5 h-5 rounded bg-sidebar border border-ink-faint flex items-center justify-center text-ink-muted">
          <Bot className="w-3 h-3" />
        </div>
        <span className="text-xs text-ink-muted font-medium font-sans">Assistant</span>
      </div>

      {/* AI 消息卡片 - 左侧对齐 */}
      <div className="bg-paper border border-ink-faint shadow-card rounded-lg p-4 hover:border-action/50 transition-all duration-300 cursor-default mr-8">
        <p className="text-sm text-ink leading-relaxed mb-4 font-serif">{content}</p>

        {/* 概念卡片 - 像便利贴的样式 */}
        {concepts &&
          concepts.map((concept, index) => (
            <div
              key={index}
              className="bg-thought-bg border border-amber-100 rounded-md p-3 flex gap-3 items-start cursor-pointer hover:bg-amber-100/80 transition-colors group/card mt-3"
            >
              <div className="mt-0.5 text-thought">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-ink mb-0.5 group-hover/card:text-amber-800">
                  {concept.title}
                </div>
                <div className="text-[10px] text-ink-muted leading-normal font-sans">
                  {concept.description}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export const ChatCardList: React.FC<Messages> = ({ messages }) => {
  return (
    <div className="flex flex-col space-y-6 p-6 bg-desk">
      {messages.map((message) => (
        <ChatCard key={message.id} message={message} />
      ))}
    </div>
  );
};
