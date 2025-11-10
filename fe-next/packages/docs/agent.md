## 项目概要：混合型金融 Agent 与协同文档 技术方案

### 1. 项目愿景（Project Vision）

构建一个混合型金融分析助手。该助手以“聊天”为核心交互入口，但不局限于纯文本回复。它利用
Vercel AI SDK 的 `generateUI`（生成式 UI）能力，将 Agent
的分析结果以富组件（如股票卡片、报告摘要）形式在聊天流中响应。这些富组件充当桥梁，引导用户点击下钻到两个不同的功能区域：

- 详情页（Detail Pages）：用于展示高密度数据（如图表、财务报表）。
- 协同文档（Collab Pages）：用于 AI 辅助的多人实时报告撰写。

### 2. 核心架构：两大系统的无缝集成

我们的 Next.js 应用将并存两套平行系统，由富组件作为智能路由器。

#### 系统 A：AI Agent 系统（基于 HTTP/Stream）

- 区域：`app/page.tsx`（主聊天界面）。
- 前端核心：Vercel AI SDK。
- `useChat` Hook：用于管理聊天状态（如 messages、isLoading），替代 Jotai
  用于聊天场景。
- `generateUI`：实现富组件响应，作为连接系统 B 的桥梁。
- 后端核心：`app/api/chat/route.ts`（Next.js BFF），负责编排 LLM 调用、RAG
  和工具调用。
- 说明：Vercel AI SDK 抽象了流式响应，替代了底层的 `fetch-event-source` 实现。
- UI：使用 shadcn-ui 构建聊天气泡和输入框。

#### 系统 B：协同文档系统（基于 WebSocket）

- 区域：`app/doc/[id]/page.tsx`（协同编辑器页面）。
- 前端核心：Tiptap + Jotai。
  - Tiptap 使用 `next/dynamic({ ssr: false })` 动态加载以规避 SSR 问题。
  - Jotai（如 `editorAtom`）用作 Tiptap
    编辑器实例与工具栏之间的状态总线，实现解耦与同步。
- 后端核心：PartyKit（部署在 partykit.dev），通过 `y-partykit` 处理 Tiptap/Y.js
  的 WebSocket 实时同步。
- UI：使用 shadcn-ui 构建 Tiptap 的工具栏（Toolbar）。

### 3. 辅助技术栈

#### Python（FastAPI）微服务

- 定位：内部无头（Headless）AI 微服务，不直接与前端通信，其唯一客户是 Next.js 的
  BFF。
- 职责：封装 Python 生态的重型任务，例如：
  - RAG（LlamaIndex / LangChain）与向量数据库（ChromaDB）交互。
  - Tools：使用 Tushare、yfinance 等获取实时金融数据。

#### 状态管理（Jotai）

- 职责明确：Jotai 不用于 `useChat`。
- 用途 1（核心）：充当 Tiptap 编辑器实例的状态总线，连接 `Editor.tsx` 与
  `Toolbar.tsx`。
- 用途 2（可选）：管理非聊天、非 Tiptap 的全局状态（如用户设置、API Key）。
