"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { Editor as TiptapEditor } from "@tiptap/core";

export interface EditorProps {
  content: string;
  onEditorCreate: (editor: TiptapEditor) => void; // 1. 新增回调 prop
}

export const Editor = ({content,onEditorCreate}:EditorProps) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content,
    editorProps: {
      attributes: {
        class:
          "prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none border rounded-lg p-4",
      },
    },
    onCreate: ({ editor }) => {
      onEditorCreate(editor);
    },
    immediatelyRender: false,
  });

  return (
    <div>
      <EditorContent editor={editor} />
    </div>
  );
};
