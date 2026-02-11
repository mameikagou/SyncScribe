# Spec RG-018：Workbench Mock 场景注入（四列接口版）

## 1. 目标与意图
在不依赖真实后端的情况下，验证四列联动是否正确。

## 2. 涉及文件映射
| 职责 | 文件路径 |
| :--- | :--- |
| Mock 入口 | `app/(desk)/vibe/repo-guide/RepoGuideWorkbenchMock.tsx` |

---

## 3. 详细规格（Detailed Specs）

### 文件: `app/(desk)/vibe/repo-guide/RepoGuideWorkbenchMock.tsx`

#### 3.1 意图 (Intent)
- 用可切换场景覆盖 happy/fail 两条主路径。
- 覆盖新的 guide/tree/file 端点，保障布局联动测试。

#### 3.2 核心函数

##### 函数: `createMockFetch`
- **签名:** `(scenario: RepoGuideMockScenario) => (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>`
- **依赖:** `toJsonResponse`, `getRequestUrl`
- **伪代码:**
  1. 匹配 session/index/status。
  2. 匹配新增接口：`guide/manifest`, `guide/doc`, `repo/tree`, `repo/file`。
  3. `failed` 场景下对 doc/file 返回 400 错误。

##### 组件: `RepoGuideWorkbenchMock`
- **签名:** `({ scenario = happy }: RepoGuideWorkbenchMockProps) => JSX.Element`
- **依赖:** `useEffect`, `useRef`, `RepoGuideWorkbench`
- **伪代码:**
  1. 缓存原 fetch。
  2. 注入 mock fetch。
  3. 卸载恢复原 fetch。
  4. 渲染工作台。

## 4. 错误与边界
- 卸载必须恢复原 fetch，防止污染全局。
- `scenario` 仅允许 `happy | failed`。

## 5. 验收标准（Acceptance Criteria）
1. happy 场景下四列数据都能渲染。
2. failed 场景下 Doc 或 File 请求失败时，UI 仅局部报错不崩溃。
3. mock 卸载后 fetch 行为恢复。
