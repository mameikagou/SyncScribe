# System-02：Repo Guide Workbench API 契约

> Base Path: `/api/vibe/repo-guide`

## 1. 契约原则
- 所有返回均为 JSON。
- Router 统一错误格式：`{ error: string }`。
- URL 中 `sessionId` 为工作台会话主键。
- `guide://` 协议属于前端内链，不直接走 HTTP。

## 2. 核心 DTO

### 2.1 GuideManifest
```ts
interface GuideManifest {
  categories: {
    id: string;
    title: string;
    docs: { id: string; title: string; summary: string }[];
  }[];
}
```

### 2.2 GuideDoc
```ts
interface GuideDoc {
  id: string;
  title: string;
  markdown: string;
  anchors: Array<{
    label: string;
    path: string;
    startLine: number;
    endLine: number;
  }>;
}
```

### 2.3 MagicLinkCommand
```ts
type MagicLinkCommand =
  | { action: open; file: string; startLine: number; endLine: number }
  | { action: focus; file: string; symbol: string }
  | { action: tree; path: string };
```

## 3. 端点定义

### 3.1 `POST /session`
- **意图**：创建工作台会话。
- **入参**
```json
{ "repoUrl": "https://github.com/HKUDS/nanobot", "branch": "main" }
```
- **出参**
```json
{ "sessionId": "uuid", "repoKey": "HKUDS/nanobot@main", "state": "CREATED", "branch": "main" }
```

### 3.2 `POST /index`
- **意图**：触发索引（manifest + skeleton）。
- **入参**
```json
{ "sessionId": "uuid", "force": false }
```
- **出参**
```json
{ "accepted": true, "running": true, "status": { "state": "INDEXING", "progress": 5 } }
```

### 3.3 `GET /status?sessionId=...`
- **意图**：轮询索引状态。
- **出参**：`RepoGuideIndexStatus`

### 3.4 `GET /guide/manifest?sessionId=...`
- **意图**：获取 Col1 导游目录。
- **出参**：`GuideManifest`

### 3.5 `GET /guide/doc?sessionId=...&docId=...`
- **意图**：获取 Col2 Markdown 文档。
- **出参**：`GuideDoc`

### 3.6 `GET /repo/tree?sessionId=...&path=...`
- **意图**：获取 Col4 目录树子节点（按需展开）。
- **出参**
```ts
Array<{ name: string; path: string; type: file | dir; size: number }>
```

### 3.7 `GET /repo/file?sessionId=...&path=...&startLine=...&endLine=...`
- **意图**：加载 Col3 代码内容或窗口。
- **出参**
```ts
{
  path: string;
  content: string;
  language: string;
  startLine: number;
  endLine: number;
  blobUrl: string;
}
```

## 4. Magic Link 协议（前端内链契约）
- 统一格式：`guide://<action>?<params>`
- 支持动作：
  - `guide://open?file=src/auth.ts&lines=20-45`
  - `guide://focus?file=src/types.ts&symbol=UserInterface`
  - `guide://tree?path=src/auth`
- 解析失败策略：忽略本次跳转并 toast 提示“链接格式无效”。

## 5. 错误码（MVP）
| 场景 | HTTP | 示例 |
| :--- | :---: | :--- |
| 参数校验失败 | 400 | `sessionId 不能为空` |
| session 不存在 | 400 | `Session 不存在: xxx` |
| 索引未就绪 | 400 | `索引尚未就绪，请先构建索引` |
| 文件读取失败 | 400 | `src/a.ts 不存在` |

## 6. 兼容策略
- 旧端点 `POST /ask` 保留用于生成文档内容（内部可转化为 `guide/doc` 生成步骤）。
- 新端点优先服务四列布局交互。
