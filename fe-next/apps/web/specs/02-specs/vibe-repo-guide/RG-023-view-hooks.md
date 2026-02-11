# Spec RG-023：四列 View 的 Logic Hooks

## 1. 目标与意图
让 View 组件保持 Dumb，所有状态、副作用、请求都在 Hook 层完成。

## 2. 涉及文件映射
| 职责 | 文件路径 |
| :--- | :--- |
| 导游目录 Hook（新增） | `app/(desk)/vibe/repo-guide/hooks/useGuideExplorer.ts` |
| 文档 Hook（新增） | `app/(desk)/vibe/repo-guide/hooks/useDocReader.ts` |
| 代码视图 Hook（新增） | `app/(desk)/vibe/repo-guide/hooks/useCodeEditorPane.ts` |
| 文件树 Hook（新增） | `app/(desk)/vibe/repo-guide/hooks/useRepoTree.ts` |

---

## 3. 详细规格（Detailed Specs）

### 文件: `hooks/useGuideExplorer.ts`

#### 函数: `useGuideExplorer`
- **签名:** `(params: { sessionId: string | null }) => { categories: GuideManifest[categories]; isLoading: boolean; onSelectDoc: (docId: string) => void }`
- **依赖:** `repo-guide-client.getGuideManifest`, `activeDocIdAtom`
- **伪代码:**
  1. sessionId 可用时拉取 manifest。
  2. 输出分类列表与点击回调。

### 文件: `hooks/useDocReader.ts`

#### 函数: `useDocReader`
- **签名:** `(params: { sessionId: string | null; docId: string | null }) => { doc: GuideDoc | null; isLoading: boolean; onMagicCommand: (cmd: MagicLinkCommand) => void }`
- **依赖:** `repo-guide-client.getGuideDoc`, `executeMagicCommandAtom`
- **伪代码:**
  1. docId 变化时拉取 markdown。
  2. 把 magic 命令分发到 store。

### 文件: `hooks/useCodeEditorPane.ts`

#### 函数: `useCodeEditorPane`
- **签名:** `(params: { sessionId: string | null }) => { code: string; language: string; filePath: string | null; highlightRange: {startLine:number;endLine:number} | null; isLoading: boolean }`
- **依赖:** `activeFileAtom`, `highlightRangeAtom`, `repo-guide-client.getRepoFile`
- **伪代码:**
  1. activeFile 变化时拉取 file snapshot。
  2. 更新编辑器内容与高亮范围。

### 文件: `hooks/useRepoTree.ts`

#### 函数: `useRepoTree`
- **签名:** `(params: { sessionId: string | null }) => { nodes: RepoTreeNode[]; isLoading: boolean; onExpand: (path: string) => void; onSelect: (path: string) => void }`
- **依赖:** `repo-guide-client.getRepoTree`, `expandedTreeKeysAtom`, `activeFileAtom`
- **伪代码:**
  1. 初始化拉根目录。
  2. 展开节点时按需请求子目录。
  3. 选择文件时设置 `activeFile`。

## 4. 错误与边界
- sessionId 为空时 hooks 返回空态，不发请求。
- 任何请求失败只影响对应列，不中断其他列。

## 5. 验收标准（Acceptance Criteria）
1. 所有 View 组件都依赖对应 Hook，不直接 fetch。
2. hooks 输出结构可直接驱动 UI 渲染。
3. 同一 session 下，四列状态能通过 store 联动。
