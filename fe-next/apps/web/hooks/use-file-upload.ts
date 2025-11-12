import { useState } from 'react';

export function useFileUpload() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const uploadFiles = async (fileList: FileList): Promise<string[]> => {
    setIsUploading(true);
    const urls: string[] = [];
    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];

        if (!file) {
          throw new Error(`${file} might be undefined`);
        }

        const response = await fetch(`/api/upload?filename=${file.name}`, {
          method: 'POST',
          body: file,
        });

        if (!response.ok) {
          throw new Error(`Upload failed for ${file.name}`);
        }

        const blob = await response.json();
        urls.push(blob.url);
      }
    } catch (error) {
      console.error('Upload error:', error);
      throw error; // 抛出错误让 UI 层决定如何提示
    } finally {
      setIsUploading(false);
    }
    return urls;
  };

  const clearFiles = () => {
    setFiles(null);
  };

  return {
    files,
    setFiles,
    isUploading,
    uploadFiles,
    clearFiles,
  };
}
