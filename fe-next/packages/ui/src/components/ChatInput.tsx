'use client';

import React, { useRef, KeyboardEvent, useEffect, ChangeEvent, ClipboardEvent } from 'react';
import { Button } from '@workspace/ui/components/button';
import { Textarea } from '@workspace/ui/components/textarea';
import { Paperclip, X, ArrowUp, FileImage } from 'lucide-react';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  files?: FileList | null;
  setFiles?: (files: FileList | null) => void;
  onSubmit: (e: never) => void;
  isLoading?: boolean;
}

const mergeFiles = (existing: FileList | null | undefined, incoming: File[]) => {
  const dt = new DataTransfer();

  // 1. 先加入旧文件
  if (existing) {
    Array.from(existing).forEach((file) => dt.items.add(file));
  }

  // 2. 再加入新文件 (去重可选，这里暂不去重)
  incoming.forEach((file) => dt.items.add(file));

  return dt.files;
};

export function ChatInput({
  input,
  setInput,
  files,
  setFiles,
  onSubmit,
  isLoading,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    console.log('e.clipboardData', e.clipboardData);
    const items = e.clipboardData?.items;
    if (!items || !setFiles) return;

    const pastedFiles: File[] = [];
    let hasImage = false;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      // 检查是否为图片类型
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          pastedFiles.push(file);
          hasImage = true;
        }
      }
    }

    // 如果发现了图片，阻止默认粘贴（避免在文本框出现乱码），并更新状态
    if (hasImage && pastedFiles.length > 0) {
      e.preventDefault();
      const newFileList = mergeFiles(files, pastedFiles);
      setFiles(newFileList);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (setFiles) {
        // 这里简单覆盖，如果需要追加逻辑可以在父组件处理，或者这里做合并
        setFiles(e.target.files);
      }
    }
    // 重置 input value，允许重复选择同一文件
    e.target.value = '';
    console.log('files', files);
  };

  // 处理移除文件
  const handleRemoveFile = (indexToRemove: number) => {
    if (!files || !setFiles) return;

    // FileList 是只读的，需要使用 DataTransfer 来重建
    const dt = new DataTransfer();
    Array.from(files).forEach((file, index) => {
      if (index !== indexToRemove) {
        dt.items.add(file);
      }
    });
    setFiles(dt.files.length > 0 ? dt.files : null);
  };

  return (
    <div className="w-full max-w-3xl mx-auto relative flex flex-col items-end gap-2 p-2 border rounded-xl bg-white shadow-sm focus-within:ring-1 focus-within:ring-blue-500">
      {/* 1. 图片预览区 (仅当有文件时显示) */}
      {files && files.length > 0 && (
        <div className="flex gap-2 overflow-x-auto py-2 px-1 w-full">
          {Array.from(files).map((file, index) => (
            <div key={index} className="relative group shrink-0">
              <div className="w-16 h-16 rounded-lg border overflow-hidden bg-gray-50 flex items-center justify-center">
                {/* 简单判断是否为图片来显示预览 */}
                {file.type.startsWith('image/') ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FileImage className="text-gray-400 w-8 h-8" />
                )}
              </div>
              {/* 删除按钮 */}
              <button
                onClick={() => handleRemoveFile(index)}
                className="absolute -top-1.5 -right-1.5 bg-gray-900 text-white rounded-full p-0.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 2. 输入控制区 */}
      <div className="flex items-end gap-2">
        {/* 文件上传按钮 */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          multiple
          accept="image/*" // 限制为图片，如果需要文档可改为 "*"
          onChange={handleFileChange}
        />
        <Button
          variant="ghost"
          size="icon"
          className="mb-0.5 h-8 w-8 shrink-0 text-gray-500 hover:text-gray-700"
          onClick={() => fileInputRef.current?.click()}
          type="button" // 防止触发表单提交
        >
          <Paperclip className="h-5 w-5" />
        </Button>
      </div>
      <Textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
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
