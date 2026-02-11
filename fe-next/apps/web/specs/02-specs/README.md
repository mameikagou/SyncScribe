# Repo Guide Micro-Spec 索引（Quad Layout 版）

> 依据 `AGENTS.md`：
> - 文件数 > 10 时必须分层。
> - 每个逻辑文件/类型文件必须在 Spec 中有对应章节。

## 目录结构
- `vibe-repo-guide/`：Repo Guide Workbench 的后端与前端微规格。

## 索引表
| Spec ID | 模块 | 描述 | 对应核心文件 | 状态 |
| :--- | :--- | :--- | :--- | :--- |
| RG-001 | Types | 共享类型（含 Guidebook/MagicLink） | `server/services/vibe/repo-guide/types.ts` + `app/(desk)/vibe/repo-guide/types.ts` | 🟡 Draft |
| RG-002 | Repo Reader | GitHub/Local 读取适配 | `server/services/vibe/repo-guide/github.ts` | 🟡 Draft |
| RG-003 | Session | 会话生命周期 | `server/services/vibe/repo-guide/session.ts` | 🟡 Draft |
| RG-004 | Index Store | 索引状态与缓存 | `server/services/vibe/repo-guide/index-store.ts` | 🟡 Draft |
| RG-005 | Discovery | Manifest 构建 | `server/services/vibe/repo-guide/discovery.ts` + `manifest-builder.ts` | 🟡 Draft |
| RG-006 | Skeleton | 符号索引构建 | `server/services/vibe/repo-guide/skeleton-indexer.ts` | 🟡 Draft |
| RG-007 | Reader | Interface 快照读取 | `server/services/vibe/repo-guide/interface-reader.ts` | 🟡 Draft |
| RG-008 | Reader | Implementation 快照读取 | `server/services/vibe/repo-guide/implementation-reader.ts` + `impl-reader.ts` | 🟡 Draft |
| RG-009 | Tools | Tool Facade 与证据写入 | `server/services/vibe/repo-guide/tools.ts` + `tool-facade.ts` | 🟡 Draft |
| RG-010 | Memory | 会话记忆管理 | `server/services/vibe/repo-guide/memory.ts` | 🟡 Draft |
| RG-011 | Prompts | Planner/Teacher 提示词 | `server/services/vibe/repo-guide/prompts.ts` | 🟡 Draft |
| RG-012 | Agent | 状态机循环执行 | `server/services/vibe/repo-guide/agent-loop.ts` | 🟡 Draft |
| RG-013 | Orchestrator | session/index/guide 编排 | `server/services/vibe/repo-guide/orchestrator.ts` | 🟡 Draft |
| RG-014 | Router | Hono 路由控制器 | `server/routers/vibe-repo-guide.ts` | 🟡 Draft |
| RG-015 | API Entry | Hono 挂载与 Next 转发 | `server/app.ts` + `app/api/[[...route]]/route.ts` | 🟡 Draft |
| RG-016 | Page/Container | 页面入口与容器职责 | `app/(desk)/vibe/repo-guide/page.tsx` + `RepoGuideWorkbench.tsx` + `hooks/useRepoGuideWorkbench.ts` | 🟡 Draft |
| RG-017 | Layout/View | 四列布局与视图组件 | `components/QuadWorkbenchLayout.tsx` + `GuideExplorer.tsx` + `DocReader.tsx` + `CodeEditorPane.tsx` + `RepoTree.tsx` | 🟡 Draft |
| RG-018 | Mock | 工作台 mock 注入 | `app/(desk)/vibe/repo-guide/RepoGuideWorkbenchMock.tsx` | 🟡 Draft |
| RG-019 | Legacy | 离线 skeleton 生成 | `server/services/vibe/repo-guide/skeleton.ts` | 🟡 Draft |
| RG-020 | Protocol | Magic Link 解析器 | `app/(desk)/vibe/repo-guide/lib/magic-link.ts` | 🟡 Draft |
| RG-021 | Markdown | Magic Markdown 渲染器 | `app/(desk)/vibe/repo-guide/components/MagicMarkdownRenderer.tsx` | 🟡 Draft |
| RG-022 | Store | Jotai Workbench Store | `app/(desk)/vibe/repo-guide/store/workbench-atoms.ts` | 🟡 Draft |
| RG-023 | Hooks | 四列逻辑 Hooks | `app/(desk)/vibe/repo-guide/hooks/useGuideExplorer.ts` + `useDocReader.ts` + `useCodeEditorPane.ts` + `useRepoTree.ts` | 🟡 Draft |
| RG-024 | Client | 前端请求层 | `app/(desk)/vibe/repo-guide/services/repo-guide-client.ts` | 🟡 Draft |
| RG-025 | Guide Manifest | 导游目录生成服务 | `server/services/vibe/repo-guide/guide-manifest.ts` + `server/repositories/vibe/repo-guide-manifest-repo.ts` | 🟡 Draft |
| RG-026 | Guide Markdown | 导游文档生成服务 | `server/services/vibe/repo-guide/guide-markdown.ts` + `server/repositories/vibe/repo-guide-doc-repo.ts` | 🟡 Draft |

## Builder 阅读顺序
1. RG-001 ~ RG-006（类型、会话、索引基础）
2. RG-013 ~ RG-015（编排与路由）
3. RG-024、RG-022、RG-023（前端请求层与状态层）
4. RG-017、RG-021、RG-020（四列视图与魔法链接）
5. RG-025、RG-026（Guidebook 内容生成）
