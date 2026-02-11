# Spec RG-026：Guide Markdown 生成服务

## 1. 目标与意图
按 docId 生成 Col2 文档内容，并产出可点击源码锚点（Magic Links）。

## 2. 涉及文件映射
| 职责 | 文件路径 |
| :--- | :--- |
| 业务服务（新增） | `server/services/vibe/repo-guide/guide-markdown.ts` |
| 仓储层（新增） | `server/repositories/vibe/repo-guide-doc-repo.ts` |

---

## 3. 详细规格（Detailed Specs）

### 文件: `server/services/vibe/repo-guide/guide-markdown.ts`

#### 3.1 意图 (Intent)
- 输出教学文档而不是纯技术摘要。
- 文档必须自带可执行锚点（guide://）。

#### 3.2 核心函数

##### 函数: `buildGuideMarkdown`
- **签名:** `(input: { sessionId: string; docId: string }) => Promise<GuideDoc>`
- **依赖:** `repo-guide-doc-repo`, `readInterface/readImplementation`, `deepseek`
- **伪代码:**
  1. 查缓存：doc 命中直接返回。
  2. 根据 docId 拿到候选文件与符号。
  3. 读取必要证据片段。
  4. 让模型生成教学 Markdown（包含直觉/心智模型/链路/源码锚点）。
  5. 将锚点标准化为 `guide://open` 或 `guide://focus`。
  6. 返回并缓存 `GuideDoc`。

##### 函数: `normalizeGuideAnchors`
- **签名:** `(markdown: string) => { markdown: string; anchors: GuideDoc[anchors] }`
- **依赖:** `formatGuideLink`
- **伪代码:**
  1. 扫描 markdown 中的源码引用段。
  2. 统一替换为标准 `guide://` 协议。
  3. 提取 anchors 元数据。

### 文件: `server/repositories/vibe/repo-guide-doc-repo.ts`

#### 3.3 意图 (Intent)
- 封装 doc 缓存读取，隔离存储方案。

#### 3.4 核心函数
- `getDoc(sessionId: string, docId: string): GuideDoc | null`
- `setDoc(sessionId: string, doc: GuideDoc): void`

## 4. 错误与边界
- docId 无效：抛“文档标识不存在”。
- 模型生成失败：返回 fallback markdown（至少含 1 个锚点或明确“证据不足”）。
- 锚点提取失败：文档仍可返回，但 anchors 为空并记录 warning。

## 5. 验收标准（Acceptance Criteria）
1. 每篇文档至少包含 3 个可点击锚点（成功路径）。
2. 返回体同时包含 `markdown` 和 `anchors[]`。
3. 缓存命中时不重复调用模型。
