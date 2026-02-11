# Spec RG-005：Discovery 与 Manifest 构建

## 1. 目标与意图
受控遍历仓库，生成“可索引文件清单”，作为 skeleton 构建输入。

## 2. 涉及文件映射
| 职责 | 文件路径 |
| :--- | :--- |
| 遍历与 manifest 构建 | `server/services/vibe/repo-guide/discovery.ts` |
| 兼容导出 | `server/services/vibe/repo-guide/manifest-builder.ts` |

---

## 3. 详细规格（Detailed Specs）

### 文件: `server/services/vibe/repo-guide/discovery.ts`

#### 3.1 意图 (Intent)
- 用 BFS 控制遍历深度、文件数和大小，避免索引阶段失控。
- 输出结构化 manifest，而不是散乱文件列表。

#### 3.2 核心函数

##### 函数: `buildRepoManifest`
- **签名:** `(sessionId: string, options?: BuildManifestOptions) => Promise<RepoManifest>`
- **依赖:** `requireRepoGuideSession`, `requireRepoContextBySession`, `listDirectoryContent`, `toManifestEntry`
- **伪代码:**
  1. 读取 session 与 repo context。
  2. 初始化 BFS 队列 `[{path: , depth: 0}]`。
  3. 循环遍历目录：
     - 目录且 depth 未超限 -> 入队。
     - 文件 -> 生成 manifest entry。
  4. 若 entry 超 `maxFiles`：标记 `truncated=true` 并停止。
  5. 返回 `RepoManifest`（含 totalDirectories/totalFiles/entries）。

##### 函数: `toManifestEntry`
- **签名:** `(path: string, size: number, maxFileSizeBytes: number) => RepoManifestEntry`
- **意图:** 把“路径+大小”映射到“language+hash+indexable”。

#### 3.3 规则约束
- 默认 `maxDepth=6`，`maxFiles=1800`，`maxFileSizeBytes=320KB`。
- `indexable=true` 条件：扩展名在白名单且文件大小不超限。

### 文件: `server/services/vibe/repo-guide/manifest-builder.ts`

#### 3.4 意图 (Intent)
- 兼容层：对外保留 `buildRepoManifest` 入口，避免历史 import 断裂。

#### 3.5 约束
- 禁止在该文件添加业务逻辑，只做 re-export。

## 4. 错误与边界
- `listDirectoryContent` 失败：错误上抛给 orchestrator。
- 空仓库：返回空 entries，不抛错。
- 超大仓库：`truncated=true`，流程可继续。

## 5. 验收标准（Acceptance Criteria）
1. Manifest 输出包含 `path/language/size/hash/indexable`。
2. 达到 `maxFiles` 后停止遍历并标记 `truncated=true`。
3. `manifest-builder.ts` 仅 re-export，不引入额外状态。
4. `indexableFiles` 可被后续 stats 正确统计。
