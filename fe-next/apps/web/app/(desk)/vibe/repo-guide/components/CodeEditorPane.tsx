'use client';

// Spec 来源：
// - specs/02-specs/vibe-repo-guide/RG-017-workbench-ui.md

import { useEffect, useRef } from 'react';
import MonacoEditor, { type OnMount } from '@monaco-editor/react';
import type { CodeEditorVM } from '@/app/(desk)/vibe/repo-guide/types';

type CodeEditorPaneProps = {
  vm: CodeEditorVM;
};

export default function CodeEditorPane({ vm }: CodeEditorPaneProps) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const decorationsRef = useRef<string[]>([]);

  const handleMount: OnMount = (editorInstance) => {
    editorRef.current = editorInstance;
  };

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !vm.highlightRange) {
      return;
    }

    const range = vm.highlightRange;
    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [
      {
        range: {
          startLineNumber: range.startLine,
          startColumn: 1,
          endLineNumber: range.endLine,
          endColumn: 1,
        },
        options: {
          isWholeLine: true,
          className: 'bg-amber-50',
          marginClassName: 'bg-amber-100',
        },
      },
    ]);

    editor.revealLineInCenter(range.startLine);
  }, [vm.highlightRange]);

  if (!vm.filePath) {
    return <div className="p-4 text-sm text-stone-500">文档魔法链接或文件树点击后，这里会显示源码。</div>;
  }

  return (
    <div className="relative h-full">
      <div className="border-b border-stone-200 px-3 py-2 text-xs text-stone-500">{vm.filePath}</div>
      {vm.isLoading && <div className="absolute right-3 top-3 z-10 text-xs text-stone-500">加载中...</div>}
      <MonacoEditor
        key={vm.filePath}
        language={vm.language}
        value={vm.code}
        onMount={handleMount}
        options={{
          readOnly: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 13,
        }}
        height="calc(100% - 32px)"
        theme="vs"
      />
    </div>
  );
}
