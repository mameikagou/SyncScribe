# Spec RG-016：页面入口与容器职责

## 1. 目标与意图
把路由入口、容器编排、具体视图拆开，避免 `page.tsx` 变胖。

## 2. 涉及文件映射
| 职责 | 文件路径 |
| :--- | :--- |
| 页面入口 | `app/(desk)/vibe/repo-guide/page.tsx` |
| 容器组件（现有） | `app/(desk)/vibe/repo-guide/RepoGuideWorkbench.tsx` |
| 容器逻辑（新增） | `app/(desk)/vibe/repo-guide/hooks/useRepoGuideWorkbench.ts` |

---

## 3. 详细规格（Detailed Specs）

### 文件: `app/(desk)/vibe/repo-guide/page.tsx`

#### 3.1 意图 (Intent)
- 只负责页面挂载，不承载业务状态。

#### 3.2 函数
##### 函数: `RepoGuidePage`
- **签名:** `() => JSX.Element`
- **依赖:** `RepoGuideWorkbench`
- **伪代码:**
  1. 直接返回 `<RepoGuideWorkbench />`。

### 文件: `app/(desk)/vibe/repo-guide/RepoGuideWorkbench.tsx`

#### 3.3 意图 (Intent)
- 作为页面容器，拼装四列 View 和顶层 Hook。

#### 3.4 函数
##### 组件: `RepoGuideWorkbench`
- **签名:** `() => JSX.Element`
- **依赖:** `useRepoGuideWorkbench`, `QuadWorkbenchLayout`
- **伪代码:**
  1. 调用 `useRepoGuideWorkbench` 获取 ViewModel。
  2. 传递给 `QuadWorkbenchLayout`。
  3. 负责全局错误横幅与 loading 覆层。

### 文件: `app/(desk)/vibe/repo-guide/hooks/useRepoGuideWorkbench.ts`（新增）

#### 3.5 意图 (Intent)
- 承接 session/index/manifest/doc 主流程。
- 暴露给容器的单一 ViewModel。

#### 3.6 核心函数
##### Hook: `useRepoGuideWorkbench`
- **签名:** `() => RepoGuideWorkbenchVM`
- **依赖:** `repo-guide-client`, Jotai atoms
- **伪代码:**
  1. 初始化 repoUrl/branch/loading/error。
  2. 提供 `createSession/startIndex/pollStatus/loadManifest/loadDoc`。
  3. 输出四列所需状态与回调。

## 4. 错误与边界
- `page.tsx` 不处理异常。
- `RepoGuideWorkbench` 不直接 fetch。
- 业务错误由 hook 统一上抛为 UI 友好文案。

## 5. 验收标准（Acceptance Criteria）
1. `page.tsx` 只做挂载。
2. 容器组件通过 hook 获取数据，不直接请求 API。
3. 四列布局通过统一 ViewModel 驱动。
