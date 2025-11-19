import { AttachmentItem } from '@/components/AttachmentList';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export function useMediaUpload() {
  const [items, setItems] = useState<AttachmentItem[]>([]);

  const _uploadItem = async (item: AttachmentItem) => {
    // 1. 更新状态为上传中
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: 'uploading' } : i)));

    try {
      // 2. 调用您的 Vercel Blob API
      // 注意：文件名需要编码，防止中文乱码
      const filename = encodeURIComponent(item.file.name);
      const response = await fetch(`/api/upload?filename=${filename}`, {
        method: 'POST',
        body: item.file, // 直接把 File 对象作为 body 发送
      });

      if (!response.ok) throw new Error('Upload failed');

      const blob = await response.json();

      // 4. 更新状态为成功，并保存服务器 URL
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: 'success', serverUrl: blob.url } : i))
      );
    } catch (error) {
      console.error(error);
      // 5. 更新状态为失败
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: 'error' } : i)));
      toast.error('图片上传失败');
    }
  };

  const addFiles = useCallback((files: File[]) => {
    const newItems: AttachmentItem[] = files.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'pending',
    }));

    setItems((prev) => [...prev, ...newItems]);

    // 自动触发上传
    newItems.forEach((item) => _uploadItem(item));
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) {
        target.abortController?.abort();
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  // 重试
  const retryItem = useCallback(
    (id: string) => {
      // 从当前状态中找到该文件
      setItems((prev) => {
        const target = prev.find((i) => i.id === id);
        if (target) {
          // 重新调用上传逻辑
          _uploadItem(target);
        }
        return prev;
      });
    },
    [_uploadItem]
  );

  // --- 4. 清空所有 (Clear) ---
  // 用于消息发送成功后重置状态
  const clearAll = useCallback(() => {
    setItems((prev) => {
      prev.forEach((item) => {
        // 中断所有正在进行的请求
        item.abortController?.abort();
        // 释放内存
        URL.revokeObjectURL(item.previewUrl);
      });
      return [];
    });
  }, []);

  // --- 5. 自动清理 (Unmount) ---
  // 组件卸载时，防止内存泄漏
  useEffect(() => {
    return () => {
      items.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    items,
    addFiles,
    removeItem,
    retryItem,
    clearAll,
    isUploading: items.some((i) => i.status === 'uploading'),
  };
}
