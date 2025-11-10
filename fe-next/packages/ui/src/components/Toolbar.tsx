import type { Editor } from '@tiptap/core';
import { Toggle } from '@workspace/ui/components/toggle'; // 确保你已安装 shadcn-ui toggle
import { Bold, Italic, Strikethrough, Heading2 } from 'lucide-react';
import { useEffect, useState } from 'react';
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
  const forceUpdate = useForceUpdate();

  // 这里强制同步的原因是react和jotai设计哲学的“值的引用不可变性”，只看引用，不看器对象内部的属性是否变化。
  // 所以，感知不到useEditor的更新。

  // 这里的目的是，触发Toolbar的重新渲染。让它可以感知到字体的样式。
  useEffect(() => {
    if (!editor) {
      return;
    }
    const handler = () => forceUpdate();

    editor.on('update', handler);
    editor.on('selectionUpdate', handler);

    return () => {
      editor.off('update', handler);
      editor.off('selectionUpdate', handler);
    };
  }, [editor, forceUpdate]);

  //  类型守卫避免下面报错
  if (!editor) {
    return null;
  }
  return (
    <div className="border-b p-2 flex gap-1">
      <Toggle
        size="sm"
        pressed={editor.isActive('bold')} // 检查状态
        onPressedChange={() => editor.chain().focus().toggleBold().run()} // 执行命令
      >
        <Bold className="h-4 w-4" />
      </Toggle>

      <Toggle
        size="sm"
        pressed={editor.isActive('italic')}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </Toggle>

      <Toggle
        size="sm"
        pressed={editor.isActive('strike')}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="h-4 w-4" />
      </Toggle>

      <Toggle
        size="sm"
        pressed={editor.isActive('heading', { level: 2 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="h-4 w-4" />
      </Toggle>
    </div>
  );
};
