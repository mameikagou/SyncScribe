2. 技术方案：“聚合图片组件” (Component B)
目标： 在 Tiptap 编辑器中，以“合集卡片”（方案B）的形式展示一个图片数组。

2.1. Tiptap 自定义节点 (ImageCollectionNode.ts)
这是该组件的数据模型。

Node.create: 我们将创建一个名为 imageCollection 的新 Tiptap 节点。

atom: true: 标记为“原子”节点。它是一个不可分割的块，用户只能选中或删除整个块。

addAttributes: 添加一个核心属性：

images: { default: [] }：一个 string[] 数组，用于存储该合集的所有图片 URL。

addCommands: 我们将暴露一个自定义 Tiptap 命令，以便 AI 组件可以调用它：

insertImageCollection: (payload: { images: string[] }) => ...

addNodeView: （关键） 使用 ReactNodeViewRenderer 将此节点的渲染工作外包给一个 React 组件。

2.2. React 渲染组件 (ImageCollectionCard.tsx)
这是该组件的视图模型。

Props: 组件将接收 NodeViewProps，我们可以从中解构出 node.attrs.images 来获取图片数组。

UI 结构 (方案B：合集卡片):

根元素： 使用 NodeViewWrapper 包裹，它是一个 shadcn-ui 的 <Dialog> 组件（它同时是触发器和内容）。

触发器 (<DialogTrigger>)：

这就是用户在编辑器里看到的“合集卡片”。

我们会用 shadcn-ui 的 <Card> 来渲染它。

<Card> 内部：

<img src={images[0]}> (显示第一张图作为封面)。

<CardFooter> (显示文本，例如 共 ${images.length} 张图片)。

内容 (<DialogContent>)：

这是点击卡片后弹出的“Lightbox”模态框。

UI： 在模态框内部，放置一个 shadcn-ui 的 <Carousel> (轮播图) 组件。

数据： .map() 遍历 images 数组，为每张图生成一个 <CarouselItem>。

2.3. AI 与 Tiptap 的连接 (AI -> Tiptap)
触发： AI 的“富组件”(generateUI的产物，在聊天框中) 有一个“插入文档”按钮。

桥梁 (Jotai)： onClick 事件会使用 useSetAtom(editorAtom) 来获取 Tiptap 的 editor 实例。

执行： 调用我们自定义的命令： editor.chain().focus().insertImageCollection({ images: [...] }).run()。

结果： ImageCollectionNode 被插入，ImageCollectionCard.tsx 被渲染，用户在编辑器中看到了那个“合集卡片”。