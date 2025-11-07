
import { EditorHost } from "@/components/EditorHost"
import { Button } from "@workspace/ui/components/button"

export default function Page() {

  const fakeInitialContent = `
    <h2>
      你好，Tiptap!
    </h2>
    <p>
      这是从 "服务器组件" (Page.tsx) 传递过来的内容，
      并在 "客户端组件" (EditorHost.tsx) 中被加载。
    </p>
  `;


  return (
    <div className="flex items-center justify-center min-h-svh">
      <div className="flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Hello World</h1>
        <Button size="sm">Button</Button>
        <EditorHost initialContent={fakeInitialContent} />
      </div>
    </div>
  );
}
