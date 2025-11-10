1. 技术方案：Gemini 风格的“富文本聊天框” (Component A)
目标： 构建一个浮动的、半模态的、支持批量图片上传的聊天界面。

1.1. UI 架构与布局 (Floating Modal)
组件定位： 此组件不是一个独立的页面 (app/agent/page.tsx)。它将被实现为一个全局浮动组件，直接在根布局 (apps/web/app/layout.tsx) 中被渲染，以便它能覆盖在所有页面（包括协同文档页）之上。

UI 库： 使用 shadcn-ui 的 <Dialog> (或 <Drawer>) 来实现“半模态”浮动窗口。

DialogTrigger: 触发按钮（例如一个“AI助手”图标）将放在站点的全局 Header 中。

DialogContent: 我们将重写其样式，使其不居中，而是停靠在界面的右下角（或你希望的位置）。

状态管理 (全局)：

isChatOpenAtom (Jotai Atom): 一个全局 boolean 状态，用于控制 <Dialog> 的 open 属性。Header 中的触发按钮和模态框的关闭按钮都将操作这个 Atom。

isExpanded (useState)： 聊天框组件内部的本地状态。点击右上角的“展开”按钮时，此状态会改变，并通过 className 切换 DialogContent 的 width 和 height (例如 w-[400px] 切换到 w-[800px])。

1.2. 核心：富文本与多模态输入 (ChatInput)
我们将构建一个自定义的 ChatInput.tsx 组件，以取代 useChat 返回的简单 input。

状态管理 (本地)：

const [textInput, setTextInput] = useState(""); (用于文本)

const [fileList, setFileList] = useState<FileList | null>(null); (用于图片)

UI 布局：

使用一个 <form> 标签包裹。

图片预览区： 在输入框的上方。当 fileList 状态不为空时，遍历 fileList (它是一个类数组)，Array.from(fileList).map(...)，并为每个 File 对象渲染一个带“移除”按钮的缩略图。

文本输入区： 使用 shadcn-ui 的 <Textarea>，它的 value 绑定到 textInput。

工具栏：

+ 按钮： 这是一个 shadcn-ui 的 <Button>，它会程序化地触发一个隐藏的 <input type="file" multiple /> 元素。

onChange: 当文件被选中时，setFileList(e.target.files)。

Vercel AI SDK V3 集成 (useChat)

我们的 AgentPage (现在是 ChatModal 组件) 依然是根组件，负责调用 useChat。

const { messages, sendMessage, status } = useChat();

关键： onSubmit 事件处理器将不再简单。

1.3. 多模态提交 (sendMessage)
Vercel AI SDK V3 的 sendMessage API 原生支持文件和文本的混合提交。

TypeScript

// 在 ChatModal 组件内部
const { messages, sendMessage, status } = useChat();
const [textInput, setTextInput] = useState("");
const [fileList, setFileList] = useState<FileList | null>(null);

const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  if (!textInput && !fileList) return;

  // 1. 调用 sendMessage，V3 接受一个包含 text 和 files 的对象
  // (这完全符合我们之前研究的 TS 类型)
  sendMessage({
    text: textInput,
    files: fileList ?? undefined, // 传递 FileList 对象
  });

  // 2. 清空状态
  setTextInput("");
  setFileList(null);
};
1.4. 后端 (api/chat/route.ts)
模型： 必须将 model 从 deepseek-chat 切换到一个多模态 (V)L M，例如 deepseek-vl 或 gemini-1.5-pro。

SDK 魔法： Vercel AI SDK 会自动处理 FileList。它会读取文件，将其转换为 base64（或上传到临时 blob），并按照多模态模型 API 要求的格式（例如 parts: [{ type: 'text', ... }, { type: 'image', ... }]）发送请求。

你几乎不需要改后端代码，只需要换个 model 的名字。