# Spec RG-022：Workbench Store（Jotai）

## 1. 目标与意图
统一管理四列联动状态，避免 props drilling 和跨组件事件耦合。

## 2. 涉及文件映射
| 职责 | 文件路径 |
| :--- | :--- |
| 状态原子（新增） | `app/(desk)/vibe/repo-guide/store/workbench-atoms.ts` |

---

## 3. 详细规格（Detailed Specs）

### 文件: `store/workbench-atoms.ts`

#### 3.1 意图 (Intent)
- 保存“当前文档、当前文件、高亮范围、树展开状态”等跨列共享状态。

#### 3.2 原子定义
- `activeDocIdAtom: Atom<string | null>`
- `activeFileAtom: Atom<string | null>`
- `highlightRangeAtom: Atom<{ startLine: number; endLine: number } | null>`
- `focusModeAtom: Atom<{ enabled: boolean; symbol?: string }>`
- `expandedTreeKeysAtom: Atom<string[]>`
- `selectedTreePathAtom: Atom<string | null>`

#### 3.3 命令执行函数
##### 函数: `executeMagicCommandAtom`（写 atom）
- **签名:** `(get, set, cmd: MagicLinkCommand) => void`
- **依赖:** 上述原子
- **伪代码:**
  1. open：设置 activeFile + highlightRange。
  2. focus：设置 activeFile + focusMode。
  3. tree：更新 expandedTreeKeys 与 selectedTreePath。

## 4. 错误与边界
- 同一命令重复执行不应导致无限状态抖动。
- focus 命令缺 symbol 时拒绝写入并提示。

## 5. 验收标准（Acceptance Criteria）
1. 文档点击 open 链接后，`activeFile` 与 `highlightRange` 同步更新。
2. tree 命令可驱动 RepoTree 自动展开并高亮。
3. 所有四列组件都通过 Jotai 读取共享状态。
