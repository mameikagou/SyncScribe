'use client';

import React, { useRef, KeyboardEvent, useEffect } from 'react';
import { Button } from '@workspace/ui/components/button';
import { Textarea } from '@workspace/ui/components/textarea';
import { Paperclip, X, ArrowUp } from 'lucide-react';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  files?: FileList | null;
  setFiles?: (files: FileList | null) => void;
  onSubmit: (e: never) => void;
  isLoading?: boolean;
}

export function ChatInput({ input, setInput, onSubmit, isLoading }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 核心逻辑：根据内容自动调整高度
  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto'; // 先重置高度，允许缩小
      textarea.style.height = `${textarea.scrollHeight}px`; // 再根据内容撑开
    }
  };

  // 当输入变化时触发调整
  useEffect(() => {
    adjustHeight();
  }, [input]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!input.trim()) return;
      onSubmit(e);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto relative flex items-end gap-2 p-2 border rounded-xl bg-white shadow-sm focus-within:ring-1 focus-within:ring-blue-500">
      <Textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="输入消息..."
        className="
          min-h-15        /* 最小高度 */
          max-h-[12.5rem]       /* 最大高度，超过这个值会出现滚动条 */
          py-3                /* 上下内边距 */
          resize-none         /* 禁止用户手动拖拽调整大小 */
          border-0            /* 去掉默认边框 */
          shadow-none         /* 去掉默认阴影 */
          focus-visible:ring-0 /* 去掉 focus 时的默认蓝框 */
          flex-grow           /* 占满剩余宽度 */
        "
        rows={1}
      />

      <Button
        onClick={onSubmit}
        disabled={isLoading || !input.trim()}
        size="icon"
        className="mb-0.5 h-8 w-8 shrink-0 rounded-full bg-blue-600 hover:bg-blue-700"
      >
        <ArrowUp className="h-4 w-4" />
      </Button>
    </div>
  );
}
