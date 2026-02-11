# Spec RG-025：Guide Manifest 生成服务

## 1. 目标与意图
从 skeleton 索引产物生成 Col1 可渲染的导游目录（章节树）。

## 2. 涉及文件映射
| 职责 | 文件路径 |
| :--- | :--- |
| 业务服务（新增） | `server/services/vibe/repo-guide/guide-manifest.ts` |
| 仓储层（新增） | `server/repositories/vibe/repo-guide-manifest-repo.ts` |

---

## 3. 详细规格（Detailed Specs）

### 文件: `server/services/vibe/repo-guide/guide-manifest.ts`

#### 3.1 意图 (Intent)
- 把“代码地图”翻译成“可阅读目录”。
- 避免前端直接理解 skeleton 细节。

#### 3.2 核心函数
##### 函数: `buildGuideManifest`
- **签名:** `(sessionId: string) => Promise<GuideManifest>`
- **依赖:** `getSkeletonByRepoKey`, `repo-guide-manifest-repo`, `deepseek`（可选）
- **伪代码:**
  1. 查缓存：manifest 已存在则返回。
  2. 从 skeleton 统计主题簇（auth/router/model/service 等）。
  3. 生成 categories + docs 列表。
  4. 写缓存并返回。

### 文件: `server/repositories/vibe/repo-guide-manifest-repo.ts`

#### 3.3 意图 (Intent)
- 封装 manifest 的 get/set，后续可从 Map 切 Prisma。

#### 3.4 核心函数
- `getManifest(sessionId: string): GuideManifest | null`
- `setManifest(sessionId: string, manifest: GuideManifest): void`

## 4. 错误与边界
- skeleton 缺失时拒绝生成并提示先索引。
- 空仓库返回空 categories（不抛异常）。

## 5. 验收标准（Acceptance Criteria）
1. 同 session 第二次请求 manifest 命中缓存。
2. manifest 至少可生成一个默认分类（即使主题聚类失败）。
3. Service 不直接操作 HTTP。
