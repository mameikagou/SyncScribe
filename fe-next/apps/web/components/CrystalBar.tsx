'use client';

import React, { useRef, KeyboardEvent, useEffect, ClipboardEvent, useState, useCallback } from 'react';
import { Button } from '@workspace/ui/components/button';
import { Textarea } from '@workspace/ui/components/textarea';
import { Paperclip, ArrowUp, Loader2, Sparkles, Square } from 'lucide-react';
import { cn } from '@workspace/tools/lib/utils';
import { useMediaUpload } from '@/hooks/use-media-upload';
import { AttachmentList } from '@/components/AttachmentList';

import { useAtom, useAtomValue } from 'jotai';
import { chatInputAtom, isGeneratingAtom } from '@/store/chat-atoms';
import { useChatSubmit } from '@/hooks/use-chat-submit';

export function CrystalBar() {
  // 2. 使用全局状态
  const [input, setInput] = useAtom(chatInputAtom);
  const isGenerating = useAtomValue(isGeneratingAtom); // 只读 loading 状态

  const { submitMessage, stop, status } = useChatSubmit();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingDraftRef = useRef<string | null>(null);
  const { items, addFiles, removeItem, retryItem, clearAll, isUploading } = useMediaUpload();
  const [isTextareaExpanded, setIsTextareaExpanded] = useState(false);

  const restorePendingDraft = useCallback(() => {
    const pending = pendingDraftRef.current;
    if (!pending) return;

    setInput((prev) => (prev.trim().length === 0 ? pending : prev));
    pendingDraftRef.current = null;
  }, [setInput]);

  // 自动高度
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto'; // Reset first
      const nextHeight = Math.min(textarea.scrollHeight, 200);
      textarea.style.height = `${nextHeight}px`; // Limit max height
      setIsTextareaExpanded(nextHeight > 48 || input.includes('\n'));
    }
  }, [input]);

  useEffect(() => {
    if (status === 'error') {
      restorePendingDraft();
      return;
    }

    if (status === 'ready') {
      pendingDraftRef.current = null;
    }
  }, [status, restorePendingDraft]);

  const handleSubmit = (e?: any) => {
    if (e) e.preventDefault();

    // 阻断条件：正在生成、正在上传、或内容为空
    if (isGenerating || isUploading) return;
    if (!input.trim() && items.length === 0) return;

    // 先快照当前输入和附件，避免后续状态变化影响发送内容
    const textToSend = input;
    pendingDraftRef.current = textToSend;

    // 提取 URL
    const successfulUrls = items
      .filter((item) => item.status === 'success' && item.serverUrl)
      .map((item) => item.serverUrl!);

    if (!textToSend.trim() && successfulUrls.length === 0) {
      pendingDraftRef.current = null;
      return;
    }

    // 清理 UI
    setInput('');
    clearAll();

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsTextareaExpanded(false);

    // 异步发送，避免等待流式响应期间输入框看起来“未清空”
    void submitMessage(textToSend, successfulUrls).catch((error) => {
      console.error('发送失败:', error);
      restorePendingDraft();
    });
  };

  const handleCancel = () => {
    stop();
    restorePendingDraft();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboardItems = e.clipboardData?.items;
    if (!clipboardItems) return;
    const pastedFiles: File[] = [];
    for (let i = 0; i < clipboardItems.length; i++) {
      const item = clipboardItems[i];
      if (item && item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) pastedFiles.push(file);
      }
    }
    if (pastedFiles.length > 0) {
      e.preventDefault();
      addFiles(pastedFiles);
    }
  };

  const hasContent = input.trim().length > 0 || items.length > 0;
  const isLoading = isGenerating || isUploading; // 统一的加载状态
  const isExpandedLayout = items.length > 0 || isTextareaExpanded;
  const isSendDisabled = isUploading || (!isGenerating && !hasContent);

  return (
    // === 3. 关键变更：Fixed 定位，全局悬浮 ===
    // z-[100] 确保它浮在所有内容之上
    // bottom-8 保持距离底部的位置
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-[680px] px-4 z-[100] pointer-events-none">
      {/* pointer-events-auto: 确保只有输入框本身可以点击，不会遮挡背后的内容 */}
      <div
        className={cn(
          'bg-white/80 backdrop-blur-xl border border-white/50 shadow-crystal transition-all duration-300 group ring-1 ring-stone-900/5 pointer-events-auto',
          'focus-within:ring-2 focus-within:ring-action/20',
          isExpandedLayout ? 'rounded-[1.5rem] p-3' : 'rounded-full p-1.5 pl-5'
        )}
      >
        {items.length > 0 && (
          <div className="mb-2 px-2">
            <AttachmentList items={items} onRemove={removeItem} onRetry={retryItem} />
          </div>
        )}

        <div className="flex items-end gap-3">
          <div className="pb-2.5 relative flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-thought opacity-80 animate-pulse-slow" />
          </div>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            multiple
            accept="image/*"
            onChange={(e) => {
              if (e.target.files?.length) addFiles(Array.from(e.target.files));
              e.target.value = '';
            }}
          />

          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Ask AI to analyze..."
            rows={1}
            className="
              min-h-[2.5rem] max-h-[12.5rem] py-2.5
              resize-none border-0 shadow-none focus-visible:ring-0
              flex-grow bg-transparent
              text-ink placeholder:text-stone-400 
              caret-action font-sans text-[15px]
            "
          />

          <div className="flex items-center gap-1 pb-0.5 pr-0.5 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full text-stone-400 hover:text-ink hover:bg-stone-100/50"
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              <Paperclip className="h-5 w-5" />
            </Button>

            <Button
              onClick={isGenerating ? handleCancel : handleSubmit}
              disabled={isSendDisabled}
              size="icon"
              className={cn(
                'h-9 w-9 rounded-full shadow-md transition-all duration-300',
                isGenerating
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : hasContent && !isLoading
                  ? 'bg-ink text-white hover:bg-action hover:scale-105 active:scale-95'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none'
              )}
            >
              {isGenerating ? (
                <Square className="h-4 w-4" />
              ) : isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUp className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
