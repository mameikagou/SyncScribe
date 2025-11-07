'use client';

import { atom, Provider, useSetAtom } from '@workspace/tools/index';
import dynamic from 'next/dynamic';
import type { TiptapEditor } from '@workspace/ui/index';
import { useMemo } from 'react';
import { editorAtom } from '@workspace/tools/Store';

// 2. 安全地加载纯客户端的 Tiptap 编辑器
const Editor = dynamic(() => import('@workspace/ui/components/Editor').then((mod) => mod.Editor), {
  ssr: false,
});

const Toolbar = dynamic(
  () => import('@workspace/ui/components/Toolbar').then((mod) => mod.Toolbar),
  { ssr: false } // 工具栏也依赖 editor 实例，所以也需要 ssr: false
);

interface EditorProps {
  content: string;
  onEditorCreate: (editor: TiptapEditor) => void;
}

function EditorLoader({ initialContent }: { initialContent: string }) {
  const setEditor = useSetAtom(editorAtom);

  const DynamicEditor = useMemo(() => {
    return Editor as React.ComponentType<EditorProps>;
  }, []);

  return (
    <DynamicEditor
      content={initialContent}
      onEditorCreate={(editor) => {
        // 3. 当 Tiptap 编辑器创建时，将其存入 atom
        setEditor(editor);
      }}
    />
  );
}

export function EditorHost({ initialContent }: { initialContent: string }) {
  return (
    // 5. Provider 是 Jotai 的根
    <Provider>
      <div className="relative border rounded-lg">
        <Toolbar />
        <EditorLoader initialContent={initialContent} />
      </div>
    </Provider>
  );
}


