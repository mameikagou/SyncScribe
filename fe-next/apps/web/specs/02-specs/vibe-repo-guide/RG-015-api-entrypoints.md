# Spec RG-015：API 入口挂载（Hono -> Next）

## 1. 目标与意图
保证四列工作台全部接口都经由统一入口转发，无需散落 route.ts。

## 2. 涉及文件映射
| 职责 | 文件路径 |
| :--- | :--- |
| Hono 应用挂载 | `server/app.ts` |
| Next catch-all 转发 | `app/api/[[...route]]/route.ts` |

---

## 3. 详细规格（Detailed Specs）

### 文件: `server/app.ts`

#### 3.1 意图 (Intent)
- 统一挂载 `/api` 下所有子路由，形成单入口。

#### 3.2 核心对象
##### 对象: `app`
- **签名:** `Hono`
- **依赖:** `vibeRepoGuideRouter`
- **伪代码:**
  1. `new Hono().basePath(/api)`
  2. `route(/vibe/repo-guide, vibeRepoGuideRouter)`
  3. 导出 `AppType`。

### 文件: `app/api/[[...route]]/route.ts`

#### 3.3 意图 (Intent)
- Next API 统一代理到 Hono。

#### 3.4 核心导出
- `GET = handle(app)`
- `POST = handle(app)`
- `export type { AppType }`

## 4. 错误与边界
- 若未挂载 `vibeRepoGuideRouter`，工作台所有接口都会 404。
- 若新增 PUT/DELETE 接口，需要补充对应导出。

## 5. 验收标准（Acceptance Criteria）
1. `GET /api/vibe/repo-guide/guide/manifest` 可命中。
2. `GET /api/vibe/repo-guide/repo/file` 可命中。
3. `AppType` 仍可供前端类型复用。
