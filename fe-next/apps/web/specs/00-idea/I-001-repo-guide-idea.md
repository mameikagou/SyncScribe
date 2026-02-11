# Idea I-001：Repo Guide（交互式代码导游）

## 1. 原始需求来源

- `fe-next/prompts/SPEC.md`
- `fe-next/prompts/SPEC3.md`

## 2. 核心问题

开源仓库阅读的真正难点不是“看不见代码”，而是：

- 迷失方向：看见几千个文件，不知道入口在哪。
- 上下文断裂：教程在网页上，代码在 IDE 里，这就导致读者要不断切屏，脑力在切换中流失。
- 缺乏叙事：只有冷冰冰的文件列表，没有“导游”讲解业务流转。

## 3. 产品一句话

用户输入 URL，系统生成一本“交互式代码导游书” (Dynamic Guidebook)。
左侧是 AI 生成的教学 Markdown，右侧是实时联动的 Monaco Editor。
读者点击文档中的“关键词”或“流程图节点”，右侧编辑器自动跳转到对应代码行并高亮，实现“按图索骥”的沉浸式阅读体验。

## 4. 关键用户故事

### 当前核心产品定义 (Idea I-001)

### Idea I-001：Repo Guide Workbench（代码导游工作台）

#### 1. 核心理念 (The Philosophy)

“左手文档，右手代码，全局在胸。”

摒弃自动播放和视频化交互。产品形态是一个“高密度代码阅读器”。
它将 AI 生成的“逻辑文档”与项目本身的“物理文件”并排显示，通过“锚点链接”实现两者之间的毫秒级联动。

#### 2. 交互布局：四列工作台 (The Quad Layout)

采用类似 Codex/IDE 的高密度布局，从左到右依次为：

| 区域 | 宽度 | 名称 | 内容与职责 |
| :--- | :--- | :--- | :--- |
| Col 1 | 250px | Guide Explorer (导游目录) | 生成的逻辑目录。这里列出的不是文件，而是 AI 梳理出的“业务剧本”。例如：01. 登录流程，02. 核心架构。 |
| Col 2 | 40% | Doc Reader (文档视窗) | 当前选中的 Markdown 文档。这里是 AI 写的“人话”解释，包含大量 `[Src Link]` 链接。样式参考 zread.ai 或 Notion。 |
| Col 3 | 40% | Code Editor (代码视窗) | 只读的 Monaco Editor。响应 Col 2 的点击，展示具体代码。支持高亮、折叠、跳转定义。 |
| Col 4 | 250px | Repo Tree (文件树) | 真实的物理文件树。展示项目的原始目录结构。用于用户手动探索或定位当前代码在项目中的位置。 |

#### 3. 关键用户故事 (The Workflow)

##### US-1：全局索引 (The Indexing)

- 场景：输入 URL 后，等待生成。
- 结果：Col 1 出现结构化目录（如 Getting Started、Core Flows）。
- 体验：用户看到的是一个“整理好的知识库目录”，而不是一堆乱糟糟的文件。

##### US-2：对照阅读 (The Mapping)

- 交互：用户在 Col 2 点击 `[Src]` 链接。
- 响应：Col 3 瞬间打开对应文件，滚动并高亮指定行。
- 响应：Col 4 自动展开文件夹，高亮当前文件位置。

#### 4. 数据与协议 (Spec Requirements)

##### 4.1 目录结构 (Guide Manifest)

Backend 生成 JSON 给前端渲染 Col 1：

```typescript
interface GuideManifest {
  categories: {
    title: string; // e.g. "Core Flows"
    docs: { id: string; title: string; summary: string }[];
  }[];
}
```

##### 4.2 魔法链接协议 (Magic Links)

Markdown 中链接必须符合以下格式：

- 格式：`guide://file?path=<path>&line=<start>-<end>`
- 示例：`[auth.ts:20-50](guide://file?path=src/auth.ts&line=20-50)`

## 5. 方案假设

- Markdown 即 UI：我们可以定义一种特殊的 Markdown 链接协议（Schema），让文本能控制编辑器。
- 双屏优于单屏：教学区（左）与代码区（右）必须同屏存在，通过交互绑定。
- 渐进式披露：不要一开始就让 AI 分析所有文件。先生成目录，用户点哪章，再生成哪章的 Markdown。

## 6. MVP 交付边界（阶段 1）

### 必须有（Backend）

- RepoGuideSession：管理导游上下文。
- SkeletonGenerator：生成文件树骨架。
- GuideMarkdownGenerator：生成带有“魔法链接”的 Markdown 内容。

### 必须有（Frontend - 核心交互）

- Magic Markdown Player：一个能解析特殊链接的 Markdown 渲染器。
- Linked Editor：只读的 Monaco Editor，支持通过 Props 控制文件路径、滚动位置和高亮区域。

### 暂不做

- 代码编辑与运行能力（目前只读）。
- 复杂的多文件 Tab 管理（MVP 每次只看一个核心文件）。

## 7. 成功标准

- 用户点击 Markdown 里的 `[src/main.ts:20-30]` 链接，右侧编辑器能在 1 秒内准确加载文件并滚动到可视区域。
- AI 生成的文档中，至少包含 3 个以上的“可点击锚点”。

## 8. 交互设计与前端形态 (Frontend Spec Preview)

这是解决“人机交互”的核心。我们将前端定义为 Guidebook Player。

### 8.1 布局设计 (Layout)

左右分栏 (Resizable Split View)：

- Left (40%)：MarkdownViewer（教程流）。
- Right (60%)：CodeWorkbench（文件树 + 代码编辑器）。

### 8.2 核心黑科技：Magic Links (魔法链接)

我们在 Markdown 中约定一种特殊的 URL Scheme，前端解析器拦截 `<a>` 标签点击事件。

- 协议格式：`guide://<action>?<params>`

示例：

#### 打开文件并高亮

- Markdown 写法：

```markdown
[核心校验逻辑](guide://open?file=src/auth.ts&lines=20-45)
```

- 交互：右侧打开 `auth.ts`，滚动到 20 行，高亮 20-45 行（黄色背景）。

#### 折叠无关代码 (Focus Mode)

- Markdown 写法：

```markdown
[查看接口定义](guide://focus?file=src/types.ts&symbol=UserInterface)
```

- 交互：右侧利用 Monaco 的 `setHiddenAreas`，把除了 `UserInterface` 之外的代码全部折叠隐藏，只让用户看重点。

#### Mermaid 图表联动

- Markdown 写法：使用 Mermaid 画图，并给节点绑定 `click` 事件指向 `guide://open...`。
- 交互：点击架构图里的方块，直接跳代码。

### 8.3 组件职责

#### MarkdownRenderer Component

- 依赖 `react-markdown` + `remark-gfm`。
- 关键逻辑：自定义 `components.a` 和 `components.code`。
- 当渲染到 `guide://` 链接时，不跳转网页，而是调用 `useWorkbenchStore.executeCommand(action)`。

#### WorkbenchStore (Zustand)

- 存储 `activeFile`（当前文件内容）。
- 存储 `highlightRange`（高亮行）。
- 存储 `focusMode`（是否开启专注模式）。

## 给 Spec Writer 的建议

当你将此 Idea 转化为 Spec 时，请重点描述 8.2 Magic Links 的数据结构，因为这是前后端（AI 生成的内容 vs 前端解析器）的契约。
