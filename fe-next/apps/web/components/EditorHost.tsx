'use client';

import dynamic from 'next/dynamic';

// 1. 安全地加载纯客户端的 Tiptap 编辑器
const Editor = dynamic(() => import('@workspace/ui/components/Editor').then((mod) => mod.Editor), {
  ssr: false,
});

export function EditorHost({ initialContent }: { initialContent?: string }) {
  return <Editor />;
}


