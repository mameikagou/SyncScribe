# Spec RG-024：前端请求层（repo-guide-client）

## 1. 目标与意图
把 HTTP 请求细节从 Hook 中剥离，形成可复用的 typed client。

## 2. 涉及文件映射
| 职责 | 文件路径 |
| :--- | :--- |
| 请求层（新增） | `app/(desk)/vibe/repo-guide/services/repo-guide-client.ts` |

---

## 3. 详细规格（Detailed Specs）

### 文件: `services/repo-guide-client.ts`

#### 3.1 意图 (Intent)
- 把 endpoint、query 拼接、错误转换、response 解析集中处理。

#### 3.2 核心函数

##### 函数: `createSession`
- **签名:** `(payload: { repoUrl: string; branch?: string }) => Promise<SessionResponse>`

##### 函数: `startIndex`
- **签名:** `(payload: { sessionId: string; force?: boolean }) => Promise<IndexKickoffResponse>`

##### 函数: `getStatus`
- **签名:** `(sessionId: string) => Promise<RepoGuideIndexStatus>`

##### 函数: `getGuideManifest`
- **签名:** `(sessionId: string) => Promise<GuideManifest>`

##### 函数: `getGuideDoc`
- **签名:** `(input: { sessionId: string; docId: string }) => Promise<GuideDoc>`

##### 函数: `getRepoTree`
- **签名:** `(input: { sessionId: string; path?: string }) => Promise<RepoTreeNode[]>`

##### 函数: `getRepoFile`
- **签名:** `(input: { sessionId: string; path: string; startLine?: number; endLine?: number }) => Promise<FileSnapshot>`

#### 3.3 通用请求函数
##### 函数: `requestJson`
- **签名:** `<T>(input: RequestInfo, init?: RequestInit) => Promise<T>`
- **伪代码:**
  1. fetch。
  2. 解析 JSON。
  3. 非 2xx 抛 `Error(body.error || fallback)`。
  4. 返回强类型对象。

## 4. 错误与边界
- 服务层统一抛 Error；UI 不解析 HTTP status。
- 请求超时策略在 Hook 或上层封装（MVP 可先不做 Abort）。

## 5. 验收标准（Acceptance Criteria）
1. Hook 层不再拼接 URL 字符串。
2. 每个 endpoint 在 client 有对应函数。
3. 错误消息与后端 `{error}` 保持一致可读。
