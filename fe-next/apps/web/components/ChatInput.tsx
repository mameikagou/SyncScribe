'use client';

import React, { useRef, KeyboardEvent, useEffect, ChangeEvent, ClipboardEvent } from 'react';
import { Button } from '@workspace/ui/components/button';
import { Textarea } from '@workspace/ui/components/textarea';
import { Paperclip, ArrowUp, Loader2 } from 'lucide-react';
import { cn } from '@workspace/tools/lib/utils';
import { useMediaUpload } from '@/hooks/use-media-upload';
import { AttachmentList } from '@/components/AttachmentList';

// 1. 引入我们写好的 Hook 和组件

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  // [变更] onSubmit 不再接收 e: never，而是接收 event 和 url 列表
  onSubmit: (e: any, attachmentUrls: string[]) => void;
  isLoading?: boolean;
}

export function ChatInput({ input, setInput, onSubmit, isLoading }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 2. 使用 Hook 接管所有文件逻辑
  const {
    items, // 文件列表 (含状态)
    addFiles, // 添加并自动上传
    removeItem, // 移除
    retryItem, // 重试
    clearAll, // 清空 (用于发送成功后)
    isUploading, // 是否正在上传中
  } = useMediaUpload();

  // --- 样式逻辑：自动高度 ---
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [input]);

  // --- 事件处理：提交 ---
  const handleSubmit = (e: any) => {
    // 阻断提交：正在加载中，或者正在上传图片中
    if (isLoading || isUploading) return;

    // 阻断提交：既没有文本也没有图片
    if (!input.trim() && items.length === 0) return;

    // 提取上传成功的图片 URL
    const successfulUrls = items
      .filter((item) => item.status === 'success' && item.serverUrl)
      .map((item) => item.serverUrl!);

    // 触发父组件的发送逻辑
    onSubmit(e, successfulUrls);

    // [关键] 提交成功后，清空输入框和图片列表
    // 注意：这里假设父组件的 onSubmit 是同步的或者能在此时清空
    // 更好的做法是让父组件通过 ref 或 props 控制何时清空，但为了简单先写在这里
    setInput('');
    clearAll();

    // 重置文本框高度
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // --- 事件处理：粘贴图片 ---
  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboardItems = e.clipboardData?.items;
    if (!clipboardItems) return;

    const pastedFiles: File[] = [];
    for (let i = 0; i < clipboardItems.length; i++) {
      const item = clipboardItems[i];
      if (!item) continue;
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) pastedFiles.push(file);
      }
    }
    if (pastedFiles.length > 0) {
      e.preventDefault(); // 阻止默认粘贴，避免乱码
      addFiles(pastedFiles); // 交给 Hook 处理
    }
  };

  // --- 事件处理：文件选择 ---
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files)); // 交给 Hook 处理
    }
    e.target.value = ''; // 允许重复选择同一文件
  };

  return (
    <div className="w-full max-w-3xl mx-auto relative flex flex-col gap-2 p-2 border rounded-xl bg-white shadow-sm focus-within:ring-1 focus-within:ring-blue-500 transition-all">
      {/* 3. 使用 AttachmentList 组件渲染预览 */}
      <AttachmentList items={items} onRemove={removeItem} onRetry={retryItem} />

      <div className="flex items-end gap-2 w-full">
        {/* 隐藏的文件输入框 */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          multiple
          accept="image/*"
          onChange={handleFileChange}
        />

        {/* 触发按钮 */}
        <Button
          variant="ghost"
          size="icon"
          className="mb-0.5 h-8 w-8 shrink-0 text-gray-500 hover:text-gray-700"
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        {/* 文本输入 */}
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="输入消息或粘贴图片..."
          className="
            min-h-[2.5rem]
            max-h-[12.5rem]
            py-2
            resize-none
            border-0
            shadow-none
            focus-visible:ring-0
            flex-grow
            bg-transparent
          "
          rows={1}
        />

        {/* 发送按钮 */}
        <Button
          onClick={handleSubmit}
          // 禁用条件：正在加载 OR 正在上传 OR (没字且没图)
          disabled={isLoading || isUploading || (!input.trim() && items.length === 0)}
          size="icon"
          className={cn(
            'mb-0.5 h-8 w-8 shrink-0 rounded-full transition-colors text-white',
            isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          )}
        >
          {/* 如果正在上传，显示转圈圈，否则显示箭头 */}
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowUp className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
