"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

export const Editor = () => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: `
      <h2>
        你好，Tiptap!
      </h2>
      <p>
        这是一个在 Monorepo <b>packages/ui</b> 中运行的富文本编辑器。
      </p>
        `,
    editorProps: {
      attributes: {
        class:
          "prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none border rounded-lg p-4",
      },
    },
    immediatelyRender: false,
  });

  return (
    <div>
      <EditorContent editor={editor} />
    </div>
  );
};
