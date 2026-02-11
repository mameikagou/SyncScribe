# Spec RG-019：Legacy Skeleton Generator（扩展脚本）

## 1. 目标与意图
保留基于 ast-grep 的离线 skeleton 生成能力，用于 demo 或大仓库预处理。

## 2. 涉及文件映射
| 职责 | 文件路径 |
| :--- | :--- |
| 离线 skeleton 生成 | `server/services/vibe/repo-guide/skeleton.ts` |

---

## 3. 详细规格（Detailed Specs）

### 文件: `server/services/vibe/repo-guide/skeleton.ts`

#### 3.1 意图 (Intent)
- 与在线索引（`skeleton-indexer.ts`）并行存在：
  - 在线索引偏轻量、快速。
  - 离线生成偏完整、多语言。

#### 3.2 核心函数

##### 函数: `generateRepoSkeleton`
- **签名:** `(options: GenerateRepoSkeletonOptions) => Promise<RepoSkeleton>`
- **依赖:** `@ast-grep/napi`, `fs/path`, `shouldIgnorePath`
- **伪代码:**
  1. 解析 repoRoot 并收集候选文件。
  2. 按扩展名映射语言与 parser。
  3. 逐文件 parse AST，按规则抽 symbol。
  4. 汇总 summary/files/errors。

##### 函数: `saveRepoSkeletonToFile`
- **签名:** `(skeleton: RepoSkeleton, outputPath: string) => Promise<string>`
- **意图:** 将 skeleton JSON 落盘用于复用。

#### 3.3 与主链路关系
- **当前阶段定位:** 可选能力，不属于 `/api/vibe/repo-guide/*` 主流程强依赖。
- **使用场景:** `repo-skeleton` 路由和脚本演示。

## 4. 错误与边界
- 不支持语言计入 `skippedUnsupportedCount`。
- 文件过大计入 `skippedBySizeCount`。
- parse 失败写入 errors，不阻断全局产出。

## 5. 验收标准（Acceptance Criteria）
1. 运行后生成 `summary + files + errors` 三段结构。
2. `saveRepoSkeletonToFile` 返回绝对输出路径。
3. 忽略规则与主流程一致（不会扫描 node_modules/.git 等）。
