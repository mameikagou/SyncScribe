'use client';
import React from 'react';
import { ChatCardList } from '@/components/ChatCards';
import { Messages, messagesAtom } from '@/store/chat-atoms';
import { useAtomValue } from 'jotai';

export const ChatContainer: React.FC = () => {
  const messages = useAtomValue(messagesAtom);
  return (
    <div className="flex flex-col h-[93vh] bg-desk border-r border-ink-faint">
      <div className="flex-1 overflow-y-auto">
        <ChatCardList messages={messages} />
      </div>
    </div>
  );
};
