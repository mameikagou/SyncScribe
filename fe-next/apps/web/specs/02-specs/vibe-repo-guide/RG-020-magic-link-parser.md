# Spec RG-020：Magic Link 解析器

## 1. 目标与意图
把 Markdown 内链 `guide://...` 解析为强类型命令，作为文档到代码联动的核心契约。

## 2. 涉及文件映射
| 职责 | 文件路径 |
| :--- | :--- |
| 协议解析（新增） | `app/(desk)/vibe/repo-guide/lib/magic-link.ts` |

---

## 3. 详细规格（Detailed Specs）

### 文件: `app/(desk)/vibe/repo-guide/lib/magic-link.ts`

#### 3.1 意图 (Intent)
- 统一解析规则，防止各组件重复写 URL 解析逻辑。

#### 3.2 核心函数

##### 函数: `parseGuideLink`
- **签名:** `(href: string) => MagicLinkCommand | null`
- **依赖:** `URL` 标准库, `MagicLinkCommand` 类型
- **伪代码:**
  1. 校验 `href` 以 `guide://` 开头。
  2. 解析 action 与 query。
  3. 根据 action 组装命令：
     - open: 解析 `file` 与 `lines`。
     - focus: 解析 `file` 与 `symbol`。
     - tree: 解析 `path`。
  4. 参数缺失返回 null。

##### 函数: `formatGuideLink`
- **签名:** `(cmd: MagicLinkCommand) => string`
- **意图:** 生成标准链接，供后端或前端模板使用。

## 4. 错误与边界
- 非 `guide://` 直接返回 null。
- 行号格式非法（如 `20-xx`）返回 null。
- open 的 `endLine < startLine` 时自动交换或拒绝（实现需固定一种策略）。

## 5. 验收标准（Acceptance Criteria）
1. 三类命令 open/focus/tree 都能解析。
2. 非法链接不会抛异常，只返回 null。
3. `formatGuideLink(parseGuideLink(x))` 在合法输入下可回环。
