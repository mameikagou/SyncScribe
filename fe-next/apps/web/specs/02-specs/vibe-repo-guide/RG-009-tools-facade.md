# Spec RG-009：Tool Facade 与工具行为

## 1. 目标与意图
把索引与读取能力封装成 3 个高阶工具，供 Agent 安全调用。

## 2. 涉及文件映射
| 职责 | 文件路径 |
| :--- | :--- |
| 工具实现 | `server/services/vibe/repo-guide/tools.ts` |
| 兼容导出 | `server/services/vibe/repo-guide/tool-facade.ts` |

---

## 3. 详细规格（Detailed Specs）

### 文件: `server/services/vibe/repo-guide/tools.ts`

#### 3.1 意图 (Intent)
- 将模型调用能力限制在“检索与读取”范畴。
- 工具层负责写 memory（证据与访问历史），降低 loop 复杂度。

#### 3.2 核心函数

##### 函数: `searchSkeleton`
- **签名:** `(sessionId: string, query: string, limit?: number) => SearchSkeletonHit[]`
- **依赖:** `getSkeletonByRepoKey`, `tokenize`, `scoreFileHit`, `rememberKeyFact`
- **伪代码:**
  1. 获取 skeleton，不存在则抛错。
  2. 分词 query，空词直接返回空数组。
  3. 对每个 skeleton file 计算 score。
  4. 过滤 score<=0，排序取 topN。
  5. 记录 top 命中摘要。

##### 函数: `readInterface`
- **签名:** `(sessionId: string, path: string) => Promise<InterfaceSnapshot>`
- **依赖:** `readInterfaceSnapshot`, `rememberVisitedFile`, `appendEvidence`
- **伪代码:**
  1. 调 reader 读取接口快照。
  2. 记 visited file。
  3. 追加 evidence(kind=interface)。

##### 函数: `readImplementation`
- **签名:** `(input: ReadImplementationToolInput) => Promise<ImplementationSnapshot>`
- **依赖:** `readImplementationSnapshot`, `rememberVisitedFile`, `appendEvidence`
- **伪代码:**
  1. 调 reader 读取实现快照。
  2. 记 visited file。
  3. 追加 evidence(kind=implementation)。

### 文件: `server/services/vibe/repo-guide/tool-facade.ts`

#### 3.3 意图 (Intent)
- 导出固定工具集合，供上层以统一 import 使用。

#### 3.4 约束
- 不添加任何执行逻辑，只做 re-export。

## 4. 错误与边界
- skeleton 缺失时 `searchSkeleton` 必须明确提示先建索引。
- evidence 写入需去重（由 memory 层保证）。
- `limit` 取值必须至少 1。

## 5. 验收标准（Acceptance Criteria）
1. Agent 只通过这 3 个工具拿数据，不直接访问底层 reader。
2. 每次 read 工具调用后，memory 里可看到对应 evidence。
3. `searchSkeleton` 命中排序符合路径/符号相关性。
4. `tool-facade.ts` 仅暴露 re-export 接口。
