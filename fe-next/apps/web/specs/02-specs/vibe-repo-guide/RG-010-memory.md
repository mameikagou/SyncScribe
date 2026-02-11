# Spec RG-010：Session Memory 管理

## 1. 目标与意图
保存 Agent 在单次会话中的“已读路径、关键结论、工具轨迹、证据”，支撑多轮决策。

## 2. 涉及文件映射
| 职责 | 文件路径 |
| :--- | :--- |
| 短期记忆存储与提取 | `server/services/vibe/repo-guide/memory.ts` |

---

## 3. 详细规格（Detailed Specs）

### 文件: `server/services/vibe/repo-guide/memory.ts`

#### 3.1 意图 (Intent)
- 让 loop 不需要自己管理上下文数组。
- 在单文件内控制内存上限，防止无限增长。

#### 3.2 核心函数

##### 函数: `getSessionMemory`
- **签名:** `(sessionId: string) => SessionMemory`
- **依赖:** `ensureMemory`
- **伪代码:**
  1. 若不存在则初始化默认 memory。
  2. 返回 memory。

##### 函数: `rememberVisitedFile`
- **签名:** `(sessionId: string, filePath: string) => void`
- **依赖:** `uniquePush(limit=80)`
- **伪代码:**
  1. 获取 memory。
  2. 大小写不敏感去重追加。
  3. 超上限裁剪最旧项。

##### 函数: `rememberKeyFact`
- **签名:** `(sessionId: string, fact: string) => void`
- **依赖:** `uniquePush(limit=40)`

##### 函数: `appendToolTrace`
- **签名:** `(sessionId: string, trace: ToolTraceEntry) => void`
- **规则:** 列表上限 60。

##### 函数: `appendEvidence`
- **签名:** `(sessionId: string, evidence: EvidenceCard) => void`
- **规则:** 以 `kind+path+startLine+endLine` 去重；上限 40。

##### 函数: `buildMemoryBrief`
- **签名:** `(sessionId: string) => string`
- **意图:** 给 planner 生成紧凑上下文，减少 prompt 体积。

##### 函数: `pickPromptEvidence/pickPromptTrace`
- **签名:**
  - `(sessionId: string, maxItems?: number) => EvidenceCard[]`
  - `(sessionId: string, maxItems?: number) => ToolTraceEntry[]`
- **意图:** 仅截取尾部窗口，避免 prompt 过长。

## 4. 错误与边界
- 空字符串输入不应污染记忆（`uniquePush` 过滤空值）。
- clear 后再次读取应自动重建空 memory。

## 5. 验收标准（Acceptance Criteria）
1. 同一 evidence 重复写入不会产生重复项。
2. visitedFiles/keyFacts/toolTrace/evidence 的容量上限生效。
3. `buildMemoryBrief` 在空状态返回“暂无历史记忆。”。
4. `clearSessionMemory` 后数据被移除。
