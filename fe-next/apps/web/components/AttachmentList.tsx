'use client';

import { cn } from '@workspace/tools/lib/utils';
import { FileImage, Loader2, RefreshCw, X } from 'lucide-react';

export type UploadStatus = 'pending' | 'uploading' | 'success' | 'error';

export interface AttachmentItem {
  id: string; // 唯一标识 (用于 key)
  file: File; // 原始文件对象
  previewUrl: string; // 本地预览地址 (blob:...)
  status: UploadStatus; // 当前状态
  // progress: number; // 上传进度 0-100
  serverUrl?: string; // 上传成功后的服务端 URL
  errorMsg?: string; // 错误信息
  abortController?: AbortController; // 用于取消请求
}

interface AttachmentListProps {
  items: AttachmentItem[];
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
}

export function AttachmentList({ items, onRemove, onRetry }: AttachmentListProps) {
  if (items.length === 0) return null;

  return (
    <div className="flex gap-3 overflow-x-auto py-2 px-1 w-full scrollbar-hide select-none">
      {items.map((item) => (
        <div
          key={item.id}
          className="relative group shrink-0 animate-in fade-in zoom-in duration-200"
        >
          {/* 1. 主体容器：显示图片或图标 */}
          <div
            className={cn(
              'w-16 h-16 rounded-lg border overflow-hidden flex items-center justify-center relative transition-all bg-gray-50',
              // 错误状态显示红框，否则显示灰框
              item.status === 'error' ? 'border-red-400' : 'border-gray-200'
            )}
          >
            {/* 图片预览 vs 文件图标 */}
            {item.file.type.startsWith('image/') ? (
              <img
                src={item.previewUrl}
                alt="preview"
                className={cn(
                  'w-full h-full object-cover transition-opacity',
                  // 上传中降低透明度
                  item.status === 'uploading' ? 'opacity-60' : 'opacity-100'
                )}
              />
            ) : (
              <FileImage className="text-gray-400 w-8 h-8" />
            )}

            {/* 2. 状态遮罩层：上传中 */}
            {item.status === 'uploading' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-10">
                <Loader2 className="w-5 h-5 text-white animate-spin drop-shadow-md" />
              </div>
            )}

            {/* 3. 状态遮罩层：失败重试 */}
            {item.status === 'error' && (
              <div
                className="absolute inset-0 flex items-center justify-center bg-red-50/60 cursor-pointer z-10 hover:bg-red-100/80 transition-colors"
                onClick={() => onRetry(item.id)}
                title="点击重试"
              >
                <RefreshCw className="w-5 h-5 text-red-600 drop-shadow-sm" />
              </div>
            )}
          </div>

          {/* 4. 删除按钮 (悬浮显示) */}
          <button
            onClick={(e) => {
              e.stopPropagation(); // 防止误触重试或预览
              onRemove(item.id);
            }}
            className="
              absolute -top-2 -right-2 
              bg-gray-800 text-white 
              rounded-full p-1 
              shadow-md 
              opacity-0 group-hover:opacity-100 
              transition-all duration-200
              hover:bg-red-600 hover:scale-110 
              z-20 cursor-pointer
            "
            type="button"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
