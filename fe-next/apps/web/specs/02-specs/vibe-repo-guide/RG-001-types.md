# Spec RG-001：Repo Guide 共享类型体系（含 Guidebook）

## 1. 目标与意图
将“索引链路 + 导游文档链路 + 前端联动协议”统一成共享类型，避免前后端字段漂移。

## 2. 涉及文件映射
| 职责 | 文件路径 |
| :--- | :--- |
| 后端共享类型 | `server/services/vibe/repo-guide/types.ts` |
| 前端协议类型（新增） | `app/(desk)/vibe/repo-guide/types.ts` |

---

## 3. 详细规格（Detailed Specs）

### 文件: `server/services/vibe/repo-guide/types.ts`

#### 3.1 意图 (Intent)
- 提供服务层与路由层共享的业务类型。
- 新增 Guidebook 相关协议类型，承接四列布局。

#### 3.2 必须新增/维护类型

##### 索引域（保留）
- `IndexState`
- `RepoGuideSession`
- `RepoManifest`, `SkeletonIndex`
- `RepoGuideIndexStatus`, `RepoGuideIndexStats`

##### 导游域（新增）
```ts
type GuideManifest = {
  categories: {
    id: string;
    title: string;
    docs: { id: string; title: string; summary: string }[];
  }[];
};

type GuideDoc = {
  id: string;
  title: string;
  markdown: string;
  anchors: {
    label: string;
    path: string;
    startLine: number;
    endLine: number;
  }[];
};
```

##### 魔法链接域（新增）
```ts
type MagicLinkAction = open | focus | tree;

type MagicLinkCommand =
  | { action: open; file: string; startLine: number; endLine: number }
  | { action: focus; file: string; symbol: string }
  | { action: tree; path: string };
```

##### 文件树域（新增）
```ts
type RepoTreeNode = {
  name: string;
  path: string;
  type: file | dir;
  size: number;
  children?: RepoTreeNode[];
  isExpanded?: boolean;
};
```

### 文件: `app/(desk)/vibe/repo-guide/types.ts`（新增）

#### 3.3 意图 (Intent)
- 前端 View/Hook 共享 ViewModel 类型，避免 UI 组件直接依赖后端 DTO 细节。

#### 3.4 必须定义类型
- `WorkbenchPanelSizes`
- `GuideExplorerItemVM`
- `DocReaderVM`
- `CodeEditorVM`
- `RepoTreeVM`

## 4. 错误与边界
- 类型文件不包含运行时逻辑。
- 任意字段变更必须先改该 Spec 再改实现。

## 5. 验收标准（Acceptance Criteria）
1. 导游目录与导游文档具备独立类型（`GuideManifest/GuideDoc`）。
2. Magic Link 有明确命令联合类型（`MagicLinkCommand`）。
3. 前端新增 `types.ts`，View 与 Hook 使用同一 ViewModel。
