# System-04：依赖锁定清单（基于 package.json）

> 来源：
> - `fe-next/apps/web/package.json`
> - `fe-next/package.json`

## 1. 前端依赖锁定
| 能力 | 锁定库 | 备注 |
| :--- | :--- | :--- |
| UI 框架 | `react`, `react-dom`, `next` | 基础运行时 |
| 布局分栏 | `react-resizable-panels` | 四列/双列可调布局 |
| Markdown 渲染 | `react-markdown`, `remark-gfm` | Doc Reader 必选 |
| 代码编辑器 | `@monaco-editor/react` | Code Editor 只读渲染 |
| 状态管理 | `jotai` | Workbench 跨列联动状态 |
| 通知反馈 | `sonner` | 错误与提示 |
| 图标 | `lucide-react` | 目录与操作图标 |
| 动效 | `framer-motion` | 侧栏展开/收起（可选） |
| 请求缓存 | `swr` | GET 请求缓存与重验证 |
| 样式 | Tailwind（项目既有） | 所有页面样式统一 Tailwind |

## 2. 后端依赖锁定
| 能力 | 锁定库 | 备注 |
| :--- | :--- | :--- |
| HTTP 框架 | `hono` | Controller 层 |
| 参数校验 | `zod`, `@hono/zod-validator` | Router 输入边界 |
| AI 调度 | `ai`, `@ai-sdk/openai` | Planner/Teacher/Guide Generator |
| 代码骨架 | `@ast-grep/napi` | Skeleton 索引 |
| 数据访问 | `@prisma/client`, `prisma` | V2 持久化 |
| 连接驱动 | `@neondatabase/serverless` | Postgres serverless |

## 3. 明确不引入（本阶段）
- 不新增 `dnd-kit`（当前依赖中不存在；分栏拖动由 `react-resizable-panels` 覆盖）。
- 不引入第三方 ahooks 包；采用“手写 hooks”模式（内部封装）。

## 4. 手写 hooks 约定（ahooks-lite）
- 目录：`app/(desk)/vibe/repo-guide/hooks/`
- 基础 Hook 建议：
  - `useAsyncTask`：统一 loading/error/data 模板
  - `useDebouncedValue`：输入防抖
  - `useLatestRef`：规避闭包陈旧值
- 约束：Hook 内可有副作用；View 组件禁止 `fetch/useEffect`。

## 5. 版本升级策略
- 小版本升级需通过 Story + API contract 回归验证。
- 涉及 `hono/ai/monaco/jotai` 主版本变更时，必须先更新对应 spec 再改代码。
