## 阶段二：单机版富文本编辑器 (Single-Player Editor)

目标：在 Next.js 页面中渲染一个功能正常的富文本编辑器。

技术：Next.js（App Router、Client Component）、Tiptap

产出：

- 封装好的 Tiptap 编辑器 React 组件，例如 `Editor.tsx`。
- 在网站根页面（`/`）渲染编辑器。
- 提供基础工具栏（例如：加粗、斜体、标题）以操作编辑器内容。

说明：初期版本为本地编辑，所有内容仅存在浏览器内存，页面刷新后会丢失。

## 阶段三：实现“单机”持久化 (Stateful Single-Player)

目标：利用 Next.js 的后端能力，实现文档的保存与加载。

技术：Next.js（Route Handlers）、Tiptap、数据库（例如 Vercel Postgres）

产出：

- 新增 API 路由：`app/api/documents/[id]/route.ts`。
- GET：从数据库读取文档内容（Tiptap 的 JSON 格式）。
- POST / PUT：接收 Tiptap 的 JSON 并保存到数据库。
- 前端页面（例如 `app/doc/[id]/page.tsx`）在加载时调用 GET，并使用 `editor.commands.setContent()` 填充编辑器。
- 提供“保存”按钮以触发 PUT 调用。

说明：实现后你将拥有一个单用户、基于数据库的完整文档应用。

## 阶段四：实时协同 (Real-Time Collaboration)

目标：使用 PartyKit + Y.js 替换保存逻辑，实现实时同步。

技术：PartyKit、Y.js、y-partykit、Tiptap（Collaboration 扩展）

产出：

- 在项目根添加 `party` 文件夹与 `party/server.ts`，配置 y-partykit 后端。
- 前端移除“保存”按钮与 POST/PUT 逻辑。
- 为 Tiptap 添加 Collaboration 和 CollaborationCursor 扩展。
- 使用 `PartyKitProvider`（来自 `y-partykit`）将 Tiptap 状态绑定到 Y.Doc 并连接到 PartyKit 服务。

说明：之后在多个窗口打开同一文档时，可以实时看到对方的编辑和光标。

## 阶段五：UI 润色与完善

目标：提升界面美观和可用性。

技术：shadcn-ui、Tailwind CSS

产出：

- 使用 shadcn-ui 的 `Button`、`Toggle`、`Toolbar` 等组件重构工具栏，使其更美观。
- 在 CollaborationCursor 中使用 shadcn-ui 的 `Avatar` 展示用户头像。
- （可选）添加文档列表页以管理多个文档。

备注：以上所有修改已确保文件中不包含连续两个星号的 `**` 标记。