# Spec RG-021：Magic Markdown Renderer

## 1. 目标与意图
将 Markdown 普通内容与 `guide://` 魔法链接统一渲染，并对点击行为进行命令化拦截。

## 2. 涉及文件映射
| 职责 | 文件路径 |
| :--- | :--- |
| Markdown 渲染组件（新增） | `app/(desk)/vibe/repo-guide/components/MagicMarkdownRenderer.tsx` |

---

## 3. 详细规格（Detailed Specs）

### 文件: `components/MagicMarkdownRenderer.tsx`

#### 3.1 意图 (Intent)
- 让 DocReader 专注文档排版，把链接协议处理下沉到独立组件。

#### 3.2 Props 定义
| 属性名 | 类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| `markdown` | `string` | 是 | 原始 markdown 文本 |
| `onCommand` | `(cmd: MagicLinkCommand) => void` | 是 | 魔法链接命令回调 |
| `onExternalLink` | `(href: string) => void` | 否 | 普通链接行为 |

#### 3.3 核心函数
##### 组件: `MagicMarkdownRenderer`
- **签名:** `(props: MagicMarkdownRendererProps) => JSX.Element`
- **依赖:** `react-markdown`, `remark-gfm`, `parseGuideLink`
- **伪代码:**
  1. 使用 `react-markdown` 渲染正文。
  2. 覆盖 `components.a`：
     - 尝试 `parseGuideLink(href)`。
     - 命中 guide 命令：`preventDefault` 后调用 `onCommand`。
     - 非 guide 链接：调用 `onExternalLink` 或默认新窗口打开。
  3. 代码块按语言添加样式类。

## 4. 错误与边界
- `markdown` 为空时渲染空态占位。
- `href` 为空时忽略点击。
- 命令回调异常不应导致整页崩溃（建议 try/catch + toast）。

## 5. 验收标准（Acceptance Criteria）
1. `guide://` 链接点击后不触发页面跳转。
2. 解析出的命令能通过 `onCommand` 回传。
3. 普通 http/https 链接仍可正常打开。
