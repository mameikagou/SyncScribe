# Spec RG-014：Hono Router（四列工作台接口）

## 1. 目标与意图
对四列工作台提供稳定接口：会话、索引、导游目录、导游文档、文件树、代码读取。

## 2. 涉及文件映射
| 职责 | 文件路径 |
| :--- | :--- |
| Hono 路由定义 | `server/routers/vibe-repo-guide.ts` |

---

## 3. 详细规格（Detailed Specs）

### 文件: `server/routers/vibe-repo-guide.ts`

#### 3.1 意图 (Intent)
- 作为 Controller 层：校验、调用 orchestrator、返回响应。

#### 3.2 Schema 规格
- `sessionSchema`: `{ repoUrl: string; branch?: string }`
- `indexSchema`: `{ sessionId: string; force?: boolean }`
- `statusSchema`: `{ sessionId: string }`
- `guideManifestQuerySchema`（新增）: `{ sessionId: string }`
- `guideDocQuerySchema`（新增）: `{ sessionId: string; docId: string }`
- `repoTreeQuerySchema`（新增）: `{ sessionId: string; path?: string }`
- `repoFileQuerySchema`（新增）: `{ sessionId: string; path: string; startLine?: number; endLine?: number }`

#### 3.3 路由函数

##### Handler: `POST /session`
- **签名:** `(c: Context) => Promise<Response>`
- **依赖:** `createRepoGuideSessionOrchestration`

##### Handler: `POST /index`
- **签名:** `(c: Context) => Promise<Response>`
- **依赖:** `startRepoGuideIndexing`

##### Handler: `GET /status`
- **签名:** `(c: Context) => Promise<Response>`
- **依赖:** `getRepoGuideStatus`

##### Handler: `GET /guide/manifest`（新增）
- **签名:** `(c: Context) => Promise<Response>`
- **依赖:** `getGuideManifestOrchestration`

##### Handler: `GET /guide/doc`（新增）
- **签名:** `(c: Context) => Promise<Response>`
- **依赖:** `getGuideDocOrchestration`

##### Handler: `GET /repo/tree`（新增）
- **签名:** `(c: Context) => Promise<Response>`
- **依赖:** `getRepoTreeOrchestration`

##### Handler: `GET /repo/file`（新增）
- **签名:** `(c: Context) => Promise<Response>`
- **依赖:** `getRepoFileOrchestration`

#### 3.4 错误策略
- catch 统一返回：`{ error: message }` + `400`。

## 4. 错误与边界
- schema 不通过直接拒绝，不进入业务层。
- `/guide/doc` 缺 `docId` 必须被拦截。
- `/repo/file` 缺 `path` 必须被拦截。

## 5. 验收标准（Acceptance Criteria）
1. Router 具备 7 个工作台核心端点。
2. 每个端点都使用 zod-validator。
3. Router 内不出现索引扫描或 AI 生成逻辑。
4. 错误返回格式全端点一致。
