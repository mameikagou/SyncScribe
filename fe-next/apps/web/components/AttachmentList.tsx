// apps/web/types/upload.ts

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
