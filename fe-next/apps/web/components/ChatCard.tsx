import React from 'react';
import { Bot, User, Lightbulb } from 'lucide-react';

interface ChatBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  concepts?: Array<{
    title: string;
    description: string;
  }>;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ role, content, concepts }) => {
  if (role === 'user') {
    return (
      <div className="group">
        <div className="flex items-center gap-2 mb-2 justify-end">
          <span className="text-xs text-ink-muted font-medium">You</span>
          <div className="w-5 h-5 rounded bg-sidebar flex items-center justify-center text-ink-muted">
            <User className="w-3 h-3" />
          </div>
        </div>
        <div className="bg-paper border border-ink-faint shadow-card rounded-lg p-4 hover:border-action/50 transition-colors cursor-default ml-8">
          <p className="text-sm text-ink leading-relaxed">{content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="group">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-5 h-5 rounded bg-sidebar flex items-center justify-center text-ink-muted">
          <Bot className="w-3 h-3" />
        </div>
        <span className="text-xs text-ink-muted font-medium">Assistant</span>
      </div>
      <div className="bg-paper border border-ink-faint shadow-card rounded-lg p-4 hover:border-action/50 transition-colors cursor-default mr-8">
        <p className="text-sm text-ink leading-relaxed mb-4">{content}</p>

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
                <div className="text-[10px] text-ink-muted leading-normal">
                  {concept.description}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};
