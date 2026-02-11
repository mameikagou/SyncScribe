# Spec RG-007：Interface Reader（航拍视角）

## 1. 目标与意图
提供“结构优先”的文件视图：保留 import/注释/声明，折叠函数体，帮助 Agent 快速理解职责。

## 2. 涉及文件映射
| 职责 | 文件路径 |
| :--- | :--- |
| 接口快照读取 | `server/services/vibe/repo-guide/interface-reader.ts` |

---

## 3. 详细规格（Detailed Specs）

### 文件: `server/services/vibe/repo-guide/interface-reader.ts`

#### 3.1 意图 (Intent)
- 降低 token 消耗，避免一上来读取完整实现。
- 让 planner 能从接口形状判断“是否值得深读”。

#### 3.2 核心函数

##### 函数: `readInterfaceSnapshot`
- **签名:** `(sessionId: string, path: string, options?: ReadInterfaceOptions) => Promise<InterfaceSnapshot>`
- **依赖:** `requireRepoContextBySession`, `readRepositoryFile`, `buildInterfaceView`
- **伪代码:**
  1. 读取文件头部窗口。
  2. 调 `buildInterfaceView` 筛选结构行。
  3. 返回 `InterfaceSnapshot`（含 blobUrl）。

##### 函数: `buildInterfaceView`
- **签名:** `(source: string) => string`
- **依赖:** `isImportLine`, `isDeclarationLine`, `isCommentLine`, `foldLine`
- **伪代码:**
  1. 扫描每一行：保留 import、声明行及其最近注释。
  2. 非连续区块插入 `// ...` 作为视觉分隔。
  3. 对可折叠声明行追加 `// ... implementation hidden`。

##### 函数: `foldLine`
- **签名:** `(line: string) => string`
- **意图:** 只折叠函数实现入口，不折叠 class/interface/type 结构声明。

## 4. 错误与边界
- 文件不存在或读取失败：错误上抛。
- 无任何声明命中：回退返回 source 前 2000 字符，避免空结果。
- 折叠逻辑不能影响 `blobUrl` 行号语义（行号来自原文件快照）。

## 5. 验收标准（Acceptance Criteria）
1. 输出内容包含 import 与关键声明行。
2. 函数体入口被折叠，避免完整实现泄露。
3. 输出包含 `startLine/endLine/blobUrl`，可用于证据跳转。
4. 无声明命中时仍返回可读回退内容。
