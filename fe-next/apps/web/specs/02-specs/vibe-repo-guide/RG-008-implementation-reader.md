# Spec RG-008：Implementation Reader（街景视角）

## 1. 目标与意图
在“已确定目标文件”后读取精确实现窗口，支持按 symbol 名定位。

## 2. 涉及文件映射
| 职责 | 文件路径 |
| :--- | :--- |
| 实现快照读取 | `server/services/vibe/repo-guide/implementation-reader.ts` |
| 兼容导出 | `server/services/vibe/repo-guide/impl-reader.ts` |

---

## 3. 详细规格（Detailed Specs）

### 文件: `server/services/vibe/repo-guide/implementation-reader.ts`

#### 3.1 意图 (Intent)
- 仅在需要时读取“实现窗口”，而不是全文件。
- 优先用 symbol 定位，减少行号猜测误差。

#### 3.2 核心函数

##### 函数: `readImplementationSnapshot`
- **签名:** `(input: ReadImplementationInput) => Promise<ImplementationSnapshot>`
- **依赖:** `requireRepoContextBySession`, `findSymbolLine`, `readRepositoryFile`
- **伪代码:**
  1. 计算 `windowSize`（50~260 之间 clamp）。
  2. 尝试通过 `symbolName` 找到目标行。
  3. 推导 start/end（symbol 优先，其次入参，再次默认窗口）。
  4. 调 `readRepositoryFile` 返回快照。

##### 函数: `findSymbolLine`
- **签名:** `(sessionId: string, path: string, symbolName?: string) => number | undefined`
- **依赖:** `getSkeletonByRepoKey`, `requireRepoGuideSession`
- **伪代码:**
  1. 未传 symbolName -> return undefined。
  2. 从 skeleton 找 path 对应文件。
  3. 名称忽略大小写匹配 symbol，返回 line。

### 文件: `server/services/vibe/repo-guide/impl-reader.ts`

#### 3.3 意图 (Intent)
- 兼容层：为旧 import 保留 `readImplementationSnapshot` 出口。

#### 3.4 约束
- 不增加状态与逻辑；只 re-export。

## 4. 错误与边界
- symbol 未命中：不报错，回退默认窗口。
- start/end 未传：自动补齐。
- path 不存在：由 `readRepositoryFile` 抛错。

## 5. 验收标准（Acceptance Criteria）
1. `symbolName` 命中时，返回窗口围绕 symbol 行。
2. 未命中 symbol 时仍返回可用窗口，不中断 ask 流程。
3. 返回结果包含 `blobUrl` 与 line range。
4. `impl-reader.ts` 仅做 re-export。
