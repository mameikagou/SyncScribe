# Spec RG-017：四列工作台 UI（Quad Workbench）

## 1. 目标与意图
将 Repo Guide 落地为高密度四列布局，让“导游文档”和“源码定位”同屏联动。

## 2. 涉及文件映射
| 职责 | 文件路径 |
| :--- | :--- |
| 布局视图（新增） | `app/(desk)/vibe/repo-guide/components/QuadWorkbenchLayout.tsx` |
| 导游目录视图（新增） | `app/(desk)/vibe/repo-guide/components/GuideExplorer.tsx` |
| 文档视图（新增） | `app/(desk)/vibe/repo-guide/components/DocReader.tsx` |
| 代码视图（新增） | `app/(desk)/vibe/repo-guide/components/CodeEditorPane.tsx` |
| 文件树视图（新增） | `app/(desk)/vibe/repo-guide/components/RepoTree.tsx` |

---

## 3. 详细规格（Detailed Specs）

### 文件: `components/QuadWorkbenchLayout.tsx`

#### 3.1 意图 (Intent)
- 定义四列结构和可调宽行为，是工作台骨架。

#### 3.2 组件
##### 组件: `QuadWorkbenchLayout`
- **签名:** `(props: QuadWorkbenchLayoutProps) => JSX.Element`
- **依赖:** `react-resizable-panels`
- **伪代码:**
  1. 外层水平 PanelGroup：Col1 / Center / Col4。
  2. Center 内再次水平分割：Col2 / Col3。
  3. 两侧固定宽度，中间按比例分配。
  4. 小屏触发降级布局（侧栏折叠）。

### 文件: `components/GuideExplorer.tsx`

#### 3.3 意图 (Intent)
- 展示 GuideManifest 的章节树，点击后加载 Doc。

#### 3.4 组件
##### 组件: `GuideExplorer`
- **签名:** `(props: GuideExplorerProps) => JSX.Element`
- **依赖:** `useGuideExplorer` 返回值
- **伪代码:**
  1. 渲染 category -> docs 列表。
  2. 当前 doc 高亮。
  3. 点击触发 `onSelectDoc(docId)`。

### 文件: `components/DocReader.tsx`

#### 3.5 意图 (Intent)
- 渲染 Markdown，并把 `guide://` 点击转发为命令。

#### 3.6 组件
##### 组件: `DocReader`
- **签名:** `(props: DocReaderProps) => JSX.Element`
- **依赖:** `MagicMarkdownRenderer`
- **伪代码:**
  1. 渲染标题、摘要、正文。
  2. 拦截链接点击回调 `onMagicLink`。
  3. 无文档时显示占位态。

### 文件: `components/CodeEditorPane.tsx`

#### 3.7 意图 (Intent)
- 展示只读 Monaco，并响应 open/focus 命令定位代码。

#### 3.8 组件
##### 组件: `CodeEditorPane`
- **签名:** `(props: CodeEditorPaneProps) => JSX.Element`
- **依赖:** `@monaco-editor/react`, `useCodeEditorPane`
- **伪代码:**
  1. 初始化只读编辑器。
  2. 当 `activeFile/highlightRange` 变化时滚动+高亮。
  3. focus 模式时应用 hidden areas。

### 文件: `components/RepoTree.tsx`

#### 3.9 意图 (Intent)
- 展示真实目录结构，支持展开/选中文件并与 Col3 同步。

#### 3.10 组件
##### 组件: `RepoTree`
- **签名:** `(props: RepoTreeProps) => JSX.Element`
- **依赖:** `useRepoTree`
- **伪代码:**
  1. 按层级渲染节点。
  2. dir 节点可展开，file 节点可选中。
  3. 选中后触发 `onOpenFile(path)`。

## 4. 错误与边界
- 任一列 loading/error 不应阻塞其他列渲染。
- Link 解析失败时不跳转、仅提示。
- 代码未加载前编辑器显示 skeleton 占位。

## 5. 验收标准（Acceptance Criteria）
1. 页面在宽屏下呈现四列结构。
2. 点击 Col1 文档项可刷新 Col2 内容。
3. 点击 Col2 魔法链接可联动 Col3（代码）与 Col4（树）。
4. Col4 手动点文件可反向更新 Col3。
