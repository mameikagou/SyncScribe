# Spec RG-013：Orchestrator 编排层（索引 + 导游文档）

## 1. 目标与意图
把 session/index/guide-doc 三条流程统一在编排层，路由层只做 HTTP。

## 2. 涉及文件映射
| 职责 | 文件路径 |
| :--- | :--- |
| 编排逻辑 | `server/services/vibe/repo-guide/orchestrator.ts` |
| 导游内容服务（新增） | `server/services/vibe/repo-guide/guide-manifest.ts` |
| 导游文档服务（新增） | `server/services/vibe/repo-guide/guide-markdown.ts` |

---

## 3. 详细规格（Detailed Specs）

### 文件: `server/services/vibe/repo-guide/orchestrator.ts`

#### 3.1 意图 (Intent)
- 统一编排生命周期，避免 Router 散布业务逻辑。
- 保护并发索引任务（同 session 单任务）。

#### 3.2 核心函数

##### 函数: `createRepoGuideSessionOrchestration`
- **签名:** `(input: { repoUrl: string; branch?: string }) => Promise<RepoGuideSession>`
- **依赖:** `createRepoGuideSession`, `clearSessionMemory`, `ensureRepoGuideIndexStatus`

##### 函数: `startRepoGuideIndexing`
- **签名:** `(input: { sessionId: string; force?: boolean }) => Promise<{ accepted: true; running: true; status: RepoGuideIndexStatus }>`
- **依赖:** `runIndexPipeline`, `runningIndexJobs`

##### 函数: `getRepoGuideStatus`
- **签名:** `(sessionId: string) => RepoGuideIndexStatus`

##### 函数: `getGuideManifestOrchestration`（新增）
- **签名:** `(sessionId: string) => Promise<GuideManifest>`
- **依赖:** `buildGuideManifest`
- **伪代码:**
  1. 校验 session READY。
  2. 从缓存取 manifest；无缓存则触发生成。
  3. 返回 `GuideManifest`。

##### 函数: `getGuideDocOrchestration`（新增）
- **签名:** `(input: { sessionId: string; docId: string }) => Promise<GuideDoc>`
- **依赖:** `buildGuideMarkdown`
- **伪代码:**
  1. 校验 session READY。
  2. 校验 docId 在 manifest 中存在。
  3. 读取缓存，未命中则生成并缓存。
  4. 返回文档及 anchors。

##### 函数: `getRepoTreeOrchestration`（新增）
- **签名:** `(input: { sessionId: string; path?: string }) => Promise<RepoTreeNode[]>`
- **依赖:** `listDirectoryContent`

##### 函数: `getRepoFileOrchestration`（新增）
- **签名:** `(input: { sessionId: string; path: string; startLine?: number; endLine?: number }) => Promise<ImplementationSnapshot>`
- **依赖:** `readRepositoryFile`

## 4. 错误与边界
- session 非 READY 时，manifest/doc 相关接口拒绝。
- docId 不存在时返回明确错误。
- 索引失败后不允许生成 guide 文档。

## 5. 验收标准（Acceptance Criteria）
1. Orchestrator 暴露 session/index/status/manifest/doc/tree/file 七类能力。
2. 同 session 并发触发 index 只存在一个后台任务。
3. `getGuideDocOrchestration` 只接受 manifest 已收录的 docId。
4. 新增函数不直接依赖 `Context` 对象。
