# Spec RG-006：Skeleton 索引构建

## 1. 目标与意图
从 indexable 文件中提取“声明级符号”，形成 Agent 可检索的地图层。

## 2. 涉及文件映射
| 职责 | 文件路径 |
| :--- | :--- |
| skeleton 生成 | `server/services/vibe/repo-guide/skeleton-indexer.ts` |

---

## 3. 详细规格（Detailed Specs）

### 文件: `server/services/vibe/repo-guide/skeleton-indexer.ts`

#### 3.1 意图 (Intent)
- 以低成本正则策略先跑通 MVP（class/function/interface/type/const/method/export）。
- 保留未来接入 ast-grep/tree-sitter 的扩展空间。

#### 3.2 核心函数

##### 函数: `buildSkeletonIndex`
- **签名:** `(sessionId: string, manifest: RepoManifest, options?: BuildSkeletonOptions) => Promise<SkeletonIndex>`
- **依赖:** `fileToSkeleton`, `requireRepoGuideSession`
- **伪代码:**
  1. 合并默认 options。
  2. 从 manifest 选出 indexable 文件并按上限截断。
  3. 逐文件调用 `fileToSkeleton`：
     - 成功且有 symbols -> push。
     - 异常 -> 跳过。
  4. 返回 `SkeletonIndex(repoKey, generatedAt, files)`。

##### 函数: `fileToSkeleton`
- **签名:** `(sessionId: string, filePath: string, options: Required<BuildSkeletonOptions>) => Promise<SkeletonFile | null>`
- **依赖:** `readRepositoryFile`, `extractSymbolsFromCode`
- **伪代码:**
  1. 读取文件头部窗口（非全文）。
  2. 提取 symbols。
  3. 无符号返回 null。
  4. 有符号返回 SkeletonFile。

##### 函数: `extractSymbolsFromCode`
- **签名:** `(source: string) => SkeletonSymbol[]`
- **依赖:** `pushSymbol`, `uniqSymbols`, `shortSignature`
- **伪代码:**
  1. 按行扫描并跳过注释/空行。
  2. 用规则集依次匹配（class/function/interface/type/const/method/export）。
  3. 记录 line 与 signature。
  4. 去重后返回。

## 4. 错误与边界
- 单文件读取失败：跳过，不阻断全局索引。
- 控制词误识别为 method（如 if/for）：必须排除。
- 大文件：受 `maxLinesPerFile/maxCharsPerFile` 限制。

## 5. 验收标准（Acceptance Criteria）
1. 输出 `files[]` 仅来自 `manifest.indexable=true` 的文件。
2. 同一 symbol 不重复入 `symbols[]`。
3. `method` 提取不会包含 `if/for/while` 控制词。
4. 返回对象中的 `repoKey` 与 session 保持一致。
