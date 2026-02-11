# Spec RG-004：索引状态与缓存存储

## 1. 目标与意图
为索引流程提供单一事实来源（manifest/skeleton/status），并确保状态变更可预测。

## 2. 涉及文件映射
| 职责 | 文件路径 |
| :--- | :--- |
| 索引缓存与状态机存储 | `server/services/vibe/repo-guide/index-store.ts` |

---

## 3. 详细规格（Detailed Specs）

### 文件: `server/services/vibe/repo-guide/index-store.ts`

#### 3.1 意图 (Intent)
- 将“索引资产”与“索引状态”分离：资产按 `repoKey`，状态按 `sessionId`。
- 对 orchestrator 暴露最小可用 CRUD + 状态迁移 API。

#### 3.2 核心函数

##### 函数: `ensureRepoGuideIndexStatus`
- **签名:** `(sessionId: string, repoKey: string) => RepoGuideIndexStatus`
- **依赖:** `statusStore`, `emptyStats`
- **伪代码:**
  1. 如果 `statusStore` 已有则直接返回。
  2. 创建默认状态 `{state: CREATED, progress: 0}`。
  3. 写入并返回。

##### 函数: `patchRepoGuideIndexStatus`
- **签名:** `(sessionId: string, patch: Partial<Omit<RepoGuideIndexStatus, "sessionId">>) => RepoGuideIndexStatus`
- **依赖:** `statusStore`
- **伪代码:**
  1. 读取当前状态，不存在则抛错。
  2. 合并 patch。
  3. 对 progress 做 `[0,100]` clamp。
  4. 更新时间并回写。

##### 函数: `markRepoGuideIndexing/Ready/Failed`
- **签名:**
  - `(sessionId: string, repoKey: string) => RepoGuideIndexStatus`
  - `(sessionId: string, repoKey: string, stats: RepoGuideIndexStats) => RepoGuideIndexStatus`
  - `(sessionId: string, repoKey: string, error: string) => RepoGuideIndexStatus`
- **意图:** 固定状态迁移副作用，避免外部重复样板代码。

##### 函数: `buildIndexStats`
- **签名:** `(manifest?: RepoManifest, skeleton?: SkeletonIndex) => RepoGuideIndexStats`
- **依赖:** manifest/skeleton 数据结构
- **伪代码:**
  1. `totalFiles = manifest.totalFiles ?? 0`
  2. `indexableFiles = manifest.entries.filter(indexable).length`
  3. `skeletonFiles = skeleton.files.length`
  4. `symbolCount = sum(file.symbols.length)`

## 4. 错误与边界
- patch 未初始化状态：抛错，禁止静默创建。
- `progress` 负数或超过 100：必须被裁剪。
- 同一 `repoKey` 可被多个 `sessionId` 复用资产，不复用状态对象。

## 5. 验收标准（Acceptance Criteria）
1. `ensureRepoGuideIndexStatus` 重复调用返回同一会话状态实例（值一致）。
2. `markRepoGuideIndexReady` 后 `progress=100` 且 `state=READY`。
3. `markRepoGuideIndexFailed` 后 `state=FAILED` 且 error 非空。
4. `buildIndexStats` 统计字段可独立单测验证。
