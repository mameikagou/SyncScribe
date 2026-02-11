# AGENTS.md - AI 协作协议与工作流规范

## 项目上下文 (Context)

- 后端: 优先使用 `fe-next/apps/web/server` 中的 Hono 框架。
- 规范: 严格遵守 `fe-next/prompts/vibe.md` 中的代码风格与最佳实践（优先使用 `vibe` 目录结构）。
- 范围: 所有更改仅限于 `fe-next/apps/web` 目录。

## 核心法则 (Prime Directive)

- Spec 即真理: 代码只是思想的投影。Spec (规格文档) 是唯一的真理来源。
- 1:1 映射原则:
  - 每一个逻辑文件（包含函数的 `.ts`）和定义文件（`.d.ts` 或 `types.ts`）必须在 Spec 中有对应的独立章节。
  - 禁止出现“大概实现一下”的描述。用户阅读 Spec 时，应能直接在脑海中构建出代码的实现细节。
- 人类可读性优先:
  - Spec 不是冷冰冰的代码翻译。必须包含“意图 (Intent)”。
  - 错误示范: "调用 A 函数。"
  - 正确示范: "调用 A 函数，目的是为了清洗用户输入中的非法字符，防止 SQL 注入。"
- 严格变更锁: 禁止在没有对应的 Spec 文档或更新 Spec 文档的情况下，直接修改业务逻辑代码。


## 1. 角色定义 (Agent Personas)

### 🧠 角色 A: 架构师 (The Architect)

- 职责: 负责 `specs/01-system/` 目录。
- 任务: 定义全局技术决策、分层架构、状态管理策略。
- 前端架构决策:
  - 确定布局 (Layout) 策略。
  - 确定状态管理 (State Management) 方案 (e.g., Zustand vs Context vs React Query)。
  - 定义请求分层 (Request Layering) 标准 (e.g., Service 层封装 fetch)。
- 输出: 必须包含 Mermaid 图表（时序图、ER 图、组件树）。

### 📝 角色 B: 规格撰写者 (The Spec Writer) —— 核心角色

- 职责: 负责 `specs/02-specs/` 目录。
- 任务: 将架构蓝图拆解为代码级的施工图纸。
- 绝对准则:
  - 文件级粒度: 一个 Spec 文档对应一个具体的逻辑模块；文档内必须明确指明对应的是哪个文件路径。
  - 函数级粒度: 对核心函数，必须提供签名 (Signature)、依赖 (Deps) 和伪代码 (Pseudo-code)。
  - 解耦设计: 明确定义输入输出，隐藏内部实现细节，确保单元测试可行性。

### 🔨 角色 C: 构建者 (The Builder)

- 职责: 负责 `src/`（及 `apps/web/` 下相关）目录的具体开发。
- 任务: 将 Spec 翻译为 TypeScript 代码。
- 行为准则:
  - Pixel-Perfect Logic: 逻辑实现必须与 Spec 伪代码一致。
  - Traceability: 在复杂函数的注释中，引用 Spec 的编号或章节。
  - Don't Think, Verify: 如果发现 Spec 逻辑写不通，立刻报错，而不是自己修补。

### 🔍 角色 D: 审计员 (The Auditor)

- 职责: 负责 Code Review 和测试。
- 任务: 确保代码与 Spec 的 1:1 一致性。
- 行为准则:
  - 检查每一行关键逻辑是否有 Spec 依据。
  - 检查代码的可读性和注释是否解释了“为什么”。

## 当前核心产品定义 (Idea I-001)

### Idea I-001：Repo Guide Workbench（代码导游工作台）

#### 1. 核心理念 (The Philosophy)

“左手文档，右手代码，全局在胸。”

摒弃自动播放和视频化交互。产品形态是一个“高密度代码阅读器”。
它将 AI 生成的“逻辑文档”与项目本身的“物理文件”并排显示，通过“锚点链接”实现两者之间的毫秒级联动。

#### 2. 交互布局：四列工作台 (The Quad Layout)

采用类似 Codex/IDE 的高密度布局，从左到右依次为：

| 区域 | 宽度 | 名称 | 内容与职责 |
| :--- | :--- | :--- | :--- |
| Col 1 | 250px | Guide Explorer (导游目录) | 生成的逻辑目录。这里列出的不是文件，而是 AI 梳理出的“业务剧本”。例如：01. 登录流程，02. 核心架构。 |
| Col 2 | 40% | Doc Reader (文档视窗) | 当前选中的 Markdown 文档。这里是 AI 写的“人话”解释，包含大量 `[Src Link]` 链接。样式参考 zread.ai 或 Notion。 |
| Col 3 | 40% | Code Editor (代码视窗) | 只读的 Monaco Editor。响应 Col 2 的点击，展示具体代码。支持高亮、折叠、跳转定义。 |
| Col 4 | 250px | Repo Tree (文件树) | 真实的物理文件树。展示项目的原始目录结构。用于用户手动探索或定位当前代码在项目中的位置。 |

## 2. 撰写标准：前端与后端 (Spec Standards)

所有 Spec 文档必须遵循以下模板结构。

### 🎨 前端组件/逻辑 Spec 标准 (Frontend)

适用于 tsx 组件、hooks 或前端 utils。

模板示例：

```markdown
## 文件: `apps/web/components/feature/MyComponent.tsx`

### 1. 意图 (Intent)
- 目的: 展示用户个人信息面板，允许用户修改头像。
- 布局: 使用 Flex 布局，左侧头像，右侧表单。
- 状态管理: 使用 `useUserStore` 获取全局状态，使用本地 `useState` 控制弹窗显隐。

### 2. Props 定义
| 属性名 | 类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| `userId` | `string` | 是 | 用于获取数据的索引 |

### 3. 核心逻辑 (Hooks & Functions)
- Hook: `useFetchProfile(userId)`
  - 来源: `apps/web/hooks/use-profile.ts`
  - 逻辑: 调用 API `/api/user/:id`，处理 Loading/Error 状态。

- 函数: `handleAvatarUpload(file)`
  - 步骤 1: 校验文件大小 (<2MB)。
  - 步骤 2: 调用 `uploadService.upload(file)`。
  - 步骤 3: 成功后，调用 `updateUserStore()` 刷新全局头像。
```

### ⚙️ 后端服务 Spec 标准 (Backend/Hono)

适用于 Hono 的 Handler、Service 或 Middleware。

模板示例：

```markdown
## 文件: `apps/web/server/services/vibe/session.ts`

### 1. 意图 (Intent)
- 目的: 管理 RepoGuide 的会话生命周期，确保 Session ID 的唯一性和持久化。
- 分层: 属于 Service 层，仅处理业务逻辑，不处理 HTTP Response（由 Controller/Handler 处理）。

### 2. 接口与类型 (Types)
（此处引用或定义 interface，如 `RepoGuideSession`）

### 3. 函数详解
#### 函数: `createRepoGuideSession`
- 签名: `(repoUrl: string) => Promise<RepoGuideSession>`
- 依赖: `uuid`, `db-client`
- 伪代码/逻辑步骤:
  1. 校验: `repoUrl` 为空 -> Throw `BadRequestError`.
  2. 解析: 从 URL 解析 `owner/repo`。
  3. 生成: `sessionId = uuid()`.
  4. 持久化: `await db.insert(...)`.
  5. 返回: 返回对象。
```

## 3. 标准作业程序 (SOP)

### 阶段 1: 细化设计 (Idea -> Micro-Spec)

- Trigger: "作为 Spec Writer..."
- Action:
  - 确定涉及的文件列表（新建或修改）。
  - 为每一个文件编写 Spec 章节。
  - 自检: 看着 Spec，能脑补出代码吗？如果不能，重写。
- Stop: 等待人类确认 Spec。

### 阶段 2: 严格实现 (Spec -> Code)

- Trigger: "作为 Builder..."
- Action:
  - 打开 Spec 和对应的源文件。
  - 将伪代码转换为 TypeScript。
  - 不添加任何 Spec 中未提及的额外逻辑（Log 除外）。

### 阶段 3: 验收 (Code -> Verify)

- Trigger: "作为 Auditor..."
- Action: 逐行比对。

## 4. 文件结构与索引 (File Structure)

当 `specs/02-specs/` 目录下的文件数量超过 10 个时，必须执行以下分层策略：

- 建立子目录: 按模块分类，例如 `specs/02-specs/auth/`, `specs/02-specs/vibe/`。
- 维护索引: 在 `specs/02-specs/README.md` 中维护所有 Spec 的索引表。
- 索引表示例:

| Spec ID | 模块 | 描述 | 对应核心文件 | 状态 |
| :--- | :--- | :--- | :--- | :--- |
| RG-001 | Vibe | Session 状态管理 | server/services/vibe/session.ts | ✅ Done |

## 5. Spec 范例 (Canonical Example)

必须严格模仿以下格式。

模板示例：

````markdown
# Spec RG-001: Session 与索引状态管理

## 1. 目标与意图
建立稳定的会话与状态机基础。确保在并发请求下，同一个 Session 的状态是单一事实来源 (Single Source of Truth)。

## 2. 涉及文件映射
| 职责 | 文件路径 |
| :--- | :--- |
| 类型定义 | `server/services/vibe/repo-guide/types.ts` |
| 业务逻辑 | `server/services/vibe/repo-guide/session.ts` |
| 状态存储 | `server/services/vibe/repo-guide/index-store.ts` |

---

## 3. 详细规格 (Detailed Specs)

### 文件: `server/services/vibe/repo-guide/types.ts`
> 目的: 纯类型定义，供前后端共享（如果适用）。

```typescript
export interface RepoGuideSession {
  sessionId: string; // 唯一标识
  repoKey: string;   // owner/repo
  // ...
}
```

文件: `server/services/vibe/repo-guide/session.ts`
目的: 处理 Session 的创建与检索。

函数: `createRepoGuideSession`
签名: `(repoUrl: string, branch?: string) => Promise<RepoGuideSession>`

逻辑步骤:
- 输入校验: 检查 repoUrl 是否符合 GitHub URL 正则。若否，抛出 InvalidUrlError。
- Branch 处理: 若 branch 为空，默认为 "main"。
- ID 生成: 调用 uuid.v4() 生成 sessionId。
- 返回: 构造 RepoGuideSession 对象并返回。

文件: `server/services/vibe/repo-guide/index-store.ts`
目的: 单例模式的内存状态存储 (MVP)。

变量: `globalStatusMap`
定义: `new Map<string, RepoGuideIndexStatus>()`

说明: 全局唯一，用于暂存索引进度。

函数: `ensureRepoGuideIndexStatus`
签名: `(sessionId: string) => Promise<RepoGuideIndexStatus>`

逻辑步骤:
- 查缓存: `if (globalStatusMap.has(sessionId)) -> 直接返回`。
- 初始化: 构造默认状态对象 `{ state: 'CREATED', progress: 0 }`。
- 写入: `globalStatusMap.set(sessionId, newState)`。
- 返回: 返回新对象。
````

## 6. 前后端目录架构

- 基于当前`fe-next/apps/web/package.json`来生成`fe-next/apps/web/specs/01-system/dependence.md`。

然后锁死前后端用的库，比如 dnd-kit来做拖拽，tailwind 写 css，jotai 做状态管理。 手写 ahooks 来封装钩子。

### 1. 前端：MVVM (Model-View-ViewModel) 的变体

- 原则：UI 组件应当是“笨”的 (Dumb)，逻辑 Hooks 应当是“无头”的 (Headless)。

#### 👀 View (UI 组件)

- 只负责渲染 HTML/CSS。
- 数据全靠 props 传进来。
- 交互全靠 `props.onAction` 传出去。
- 禁止出现 `useEffect` 或 `fetch`。

#### 🧠 Logic (Custom Hooks)

- 负责状态管理 (`useState`, `useStore`)。
- 负责副作用 (`useEffect`, API 调用)。
- 负责数据转换。
- 返回 UI 所需的数据和函数。

### 2. 后端：三层架构 (Controller-Service-Repository)

- 原则：网络层不谈业务，业务层不谈 HTTP。

#### 🎮 Controller (Hono Handler)

- 负责解析 HTTP 请求 (`Params`, `Body`)。
- 负责参数校验 (`Zod`)。
- 负责调用 Service。
- 负责返回 HTTP 响应 (`JSON`, `404`, `500`)。

#### ⚙️ Service (Business Logic)

- 负责核心业务逻辑（如：“创建 Session 前先检查 Repo 是否存在”）。
- 负责数据库原子操作。
- 禁止出现 `c.json()` 或 `Context` 对象。它是纯粹的 TypeScript 函数。

### 3.1 前端分层 (Frontend: View vs Logic)

- 每一个复杂组件必须拆分为两个文件：UI 组件与 Logic Hook。
- 示例：文件树

```text
components/workbench/
├── FileTree.tsx       // (View) 纯 UI，无业务逻辑
└── useFileTree.ts     // (Logic) 状态、API、数据处理
```

- Spec 撰写要求:
  - Logic Spec (`useFileTree.ts`):
    - Input: props (`path`, `expandedKeys`)
    - Output: `{ treeData, onExpand, onSelect, isLoading }`
    - Logic: 描述如何调用 API 获取文件列表，如何处理递归结构。
  - View Spec (`FileTree.tsx`):
    - Input: ReturnType of `useFileTree`
    - Layout: 描述 DOM 结构，Tailwind 样式，如何绑定 `onExpand` 事件。

### 3.2 后端分层 (Backend: Controller vs Service)

- 业务逻辑严禁直接写在 Hono Handler 中。
- 示例：文件树

```text
server/
├── routers/
│   └── guide.ts       // (Controller) 路由定义、校验、HTTP 响应
└── services/
    └── guide.ts       // (Service) 纯业务逻辑
```
