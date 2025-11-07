import type { Editor } from '@tiptap/core';
import { Toggle } from '@workspace/ui/components/toggle'; // 确保你已安装 shadcn-ui toggle
import { Bold, Italic, Strikethrough } from 'lucide-react';
import { useState } from 'react';
import { useAtomValue } from '@workspace/tools/index';
import { editorAtom } from '@workspace/tools/Store/index';

interface ToolbarProps {
  editor: Editor | null; // 接收 editor 实例
}

function useForceUpdate() {
  const [_, setValue] = useState(0);
  return () => setValue((value) => value + 1);
}

export const Toolbar = () => {
  const editor = useAtomValue(editorAtom);

  if (!editor) {
    return null;
  }
  return (
    <div className="border border-b-0 rounded-t-lg p-2 flex gap-1">
      {/* 加粗按钮 */}
      <Toggle
        size="sm"
        pressed={editor.isActive('bold')}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </Toggle>

      {/* 斜体按钮 */}
      <Toggle
        size="sm"
        pressed={editor.isActive('italic')}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </Toggle>

      {/* 删除线按钮 */}
      <Toggle
        size="sm"
        pressed={editor.isActive('strike')}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="h-4 w-4" />
      </Toggle>
    </div>
  );
};
