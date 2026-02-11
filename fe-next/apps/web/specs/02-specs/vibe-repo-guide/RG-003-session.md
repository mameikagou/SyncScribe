# Spec RG-003：Session 生命周期管理

## 1. 目标与意图
建立 Repo Guide 的会话边界，确保每次索引与问答都绑定稳定的 `sessionId + repoKey`。

## 2. 涉及文件映射
| 职责 | 文件路径 |
| :--- | :--- |
| Session 创建/查询/状态更新 | `server/services/vibe/repo-guide/session.ts` |

---

## 3. 详细规格（Detailed Specs）

### 文件: `server/services/vibe/repo-guide/session.ts`

#### 3.1 意图 (Intent)
- 把 repo URL 解析和 session 状态管理从 orchestrator 解耦。
- 提供“必存在”的断言函数，降低下游空值分支复杂度。

#### 3.2 核心函数

##### 函数: `createRepoGuideSession`
- **签名:** `(repoUrl: string, branch?: string) => Promise<RepoGuideSession>`
- **依赖:** `resolveRepoContext`, `randomUUID`, `toRepoKey`
- **伪代码:**
  1. trim repoUrl，空值报错。
  2. 调 `resolveRepoContext` 获取统一上下文。
  3. 生成 `sessionId`。
  4. 构造 `RepoGuideSession(state=CREATED)`。
  5. 写入 `sessionStore` 和 `repoContextStore`。
  6. 返回 session。

##### 函数: `requireRepoGuideSession`
- **签名:** `(sessionId: string) => RepoGuideSession`
- **依赖:** `getRepoGuideSession`
- **伪代码:**
  1. 从 Map 取 session。
  2. 为空则抛错。
  3. 返回 session。

##### 函数: `patchRepoGuideSession`
- **签名:** `(sessionId: string, patch: Partial<...>) => RepoGuideSession`
- **依赖:** `requireRepoGuideSession`
- **伪代码:**
  1. 读取当前 session。
  2. 合并 patch，更新时间戳。
  3. 回写 store。
  4. 返回更新对象。

##### 函数: `setRepoGuideSessionState`
- **签名:** `(sessionId: string, state: IndexState, error?: string) => RepoGuideSession`
- **意图:** 状态迁移的统一入口，避免外部直接 patch 造成字段不一致。

## 4. 错误与边界
- `repoUrl` 为空：抛 `repoUrl 不能为空`。
- `sessionId` 不存在：抛 `Session 不存在: {id}`。
- local 模式下 repoKey 包含 localRoot，避免与 GitHub 仓库冲突。

## 5. 验收标准（Acceptance Criteria）
1. 创建 session 后，`state` 必须是 `CREATED`。
2. `requireRepoGuideSession` 对不存在 session 必须抛错。
3. `setRepoGuideSessionState` 能更新 `updatedAt`。
4. `repoContextStore` 与 `sessionStore` 使用同一 sessionId 作为键。
