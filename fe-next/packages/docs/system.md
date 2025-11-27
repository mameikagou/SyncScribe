# 项目概要：混合型金融 Agent 与协同文档技术方案 v2.0

## 1. 项目愿景（Project Vision）

### 1.1 目标

构建一个混合型金融学习与分析助手。该助手以「聊天」为核心交互入口，同时依托 Vercel AI SDK 的 `generateUI` 能力，在对话中直接返回富组件（股票卡片、报告摘要等），让用户在同一上下文中完成调研、分析与沉淀。

### 1.2 交互路径

富组件是三个主要功能区域的“智能路由器”：

- 详情页（Detail Pages）：展示高密度数据，如财务报表、时序图、关键指标。
- 协同文档（Collab Pages）：多人实时撰写报告，沉淀知识资产。
- 学习流（Learning Flow，新版）：把碎片化知识转化为结构化学习路径与记忆卡片。

## 2. 核心架构：双系统协同

Next.js 前端内置两套系统，通过富组件互联互通。

### 2.1 系统 A — AI Agent（HTTP / Streaming）

- 界面：`app/page.tsx`（主聊天页）。
- 前端：Vercel AI SDK + `useChat` Hook 管理消息状态；`generateUI` 负责把回复渲染成组件。
- 后端：`app/api/chat/route.ts`（Next.js BFF）。职责包含：
	- 编排 LLM / RAG / 工具调用。
	- 接收用户上传文件，暂存至 Vercel Blob/S3，再转发给 Python 服务。
	- 统一鉴权与限流。
- UI：shadcn-ui 构建聊天气泡、行动按钮与输入框。

### 2.2 系统 B — 协同文档（WebSocket）

- 界面：`app/doc/[id]/page.tsx`。
- 前端：Tiptap（动态加载以避免 SSR 问题）+ Jotai（状态总线，同步编辑区、工具条、右侧属性面板）。
- 后端：PartyKit 负责会话房间、光标同步、冲突合并。

## 3. 辅助技术栈

### 3.1 Python（FastAPI）微服务

- 定位：内部 Headless AI 服务，仅对 Next.js BFF 开放。
- 职责：
	- RAG：LlamaIndex/LangChain + pgsql。
	- 数据工具：Tushare / yfinance 获取行情、估值、财报指标。
	- 多模态分析：
		- 内容摄入：接收文本、PDF、图片 URL。
		- 视觉理解：Qwen-VL、Gemini Pro Vision 做 OCR、图表解析。
		- 建议提取：从小红书截图等非结构化内容中提炼“观点与证据”。
	- 数据入库：结果写入 Postgres（Prisma），供 RAG 与学习卡片调用。

### 3.2 状态管理（Jotai）

- 编辑器专用：维护 Tiptap 文档状态、选区、插件通信。
- 全局设置：保存用户偏好、API Key、Agent 配置。

## 4. 业务模块详解

### Module A · 趋势与建议分析（Trend Analysis）

- 输入：社交媒体贴文、截图、研报 PDF。
- 处理：Python 服务分析情绪、识别图片指标。
- 输出：结构化“博主建议”（买入/卖出/观望）+ 关键论据，以卡片列表呈现。

### Module B · 记忆银行（Memory Bank）

- 作用：长期存储用户偏好、关注股票、历史分析结论。
- 实现：Postgres（结构化数据）+ 向量数据库（语义检索）。

### Module C · AI 学习卡片与学习流（核心新增）

1. 知识提取与卡片化：
	 - AI 识别核心概念（PE、RSI、波浪理论等）。
	 - 生成 React 卡片，包含解释、实时数据、可互动控件。
2. 学习路径生成：
	 - 根据用户盲区生成 Tree/Graph 形式的学习路线。
	 - 显示掌握进度，标记待复习卡片。
3. 移动端随身记忆：
	 - 模仿 Anki 的左右滑动交互，适配 WebView/PWA。
	 - 所有进度通过 Postgres 同步，桌面分析 + 移动复习无缝切换。

## 5. 开发路线图（Roadmap Update）

- [ ] Phase 4：学习卡片系统
	- [ ] 设计 `LearningCard` 数据模型（Prisma）：`front`、`back`、`tags`、`masteryLevel`、`nextReviewDate`（艾宾浩斯曲线）。
	- [ ] 打磨“知识点提取” Prompt 策略。
	- [ ] 前端实现卡片墙、学习路径图组件。
	- [ ] 移动端复习界面：针对手机浏览器的极简交互与性能优化。