# Spec RG-002：仓库读取适配层（GitHub/Local）

## 1. 目标与意图
提供统一的“目录读取、文件读取、文件名搜索、URL 解析”能力，屏蔽 GitHub 与本地目录差异。

## 2. 涉及文件映射
| 职责 | 文件路径 |
| :--- | :--- |
| 读取适配与路径安全 | `server/services/vibe/repo-guide/github.ts` |

---

## 3. 详细规格（Detailed Specs）

### 文件: `server/services/vibe/repo-guide/github.ts`

#### 3.1 意图 (Intent)
- 对上游模块暴露统一 Repo Reader API。
- 防止路径越界（local 场景）与噪音文件干扰（ignore 规则）。

#### 3.2 核心接口与函数

##### 函数: `resolveRepoContext`
- **签名:** `(repoUrl: string, branch?: string) => Promise<RepoContext>`
- **依赖:** Node `fs/path/url`, GitHub REST API
- **伪代码:**
  1. 判断 `repoUrl` 是否本地路径。
  2. 若是本地路径：校验目录存在、读取 `.git/HEAD` 推断 branch。
  3. 若是 GitHub URL：解析 owner/repo，补齐 branch（优先入参，其次 URL hint，再次 default branch）。
  4. 返回统一 `RepoContext`。

##### 函数: `listDirectoryContent`
- **签名:** `(repo: RepoContext, rawPath?: string) => Promise<RepoDirectoryEntry[]>`
- **依赖:** `shouldIgnorePath`, GitHub contents API / local fs
- **伪代码:**
  1. 归一化 path。
  2. 按 source 分支到 local 或 github 实现。
  3. 过滤忽略路径（目录、锁文件、二进制）。
  4. 目录优先排序返回。

##### 函数: `readRepositoryFile`
- **签名:** `(repo: RepoContext, rawPath: string, options?) => Promise<RepoFileSnapshot>`
- **依赖:** `toFileSnapshot`, `buildBlobUrl`
- **伪代码:**
  1. 校验 path 不为空且不是目录。
  2. 读取原文（base64 decode 或 download_url / fs.readFile）。
  3. 按 start/end/maxChars 切窗口。
  4. 返回带 `blobUrl` 的快照。

##### 函数: `searchRepositoryFiles`
- **签名:** `(repo: RepoContext, keyword: string, limit?: number) => Promise<RepoSearchHit[]>`
- **依赖:** `scoreSearchHit`, Git tree API / local walker
- **伪代码:**
  1. 关键字 normalize。
  2. 获取候选文件路径（递归 tree 或本地 DFS）。
  3. 按文件名和位置打分。
  4. 排序并截断返回。

##### 函数: `buildBlobUrl`
- **签名:** `(repo: RepoContext, rawPath: string, startLine?: number, endLine?: number) => string`
- **意图:** 为 UI 生成可点击源码链接。

#### 3.3 路径安全约束
- local 读取必须通过 `ensureInsideRoot`，禁止 `..` 越界。
- 所有 path 必须走 `normalizeRepoPath`。

## 4. 错误与边界
- GitHub API 非 2xx：抛可读错误（包含 status 与部分 body）。
- 本地路径不存在/非目录：抛错并终止 session 创建。
- 二进制文件读取：抛“暂不展示”错误。

## 5. 验收标准（Acceptance Criteria）
1. 输入 GitHub URL 与本地绝对路径都能返回统一 RepoContext。
2. `listDirectoryContent` 结果不包含 `.git/node_modules/dist` 等忽略目录。
3. `readRepositoryFile` 返回 `path/content/language/startLine/endLine/blobUrl`。
4. local 场景下，非法路径穿越被拒绝。
5. `buildBlobUrl` 在 GitHub 场景产出 `.../blob/{branch}/{path}#Lx-Ly`。
