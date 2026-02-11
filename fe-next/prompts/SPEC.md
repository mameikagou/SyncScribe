
## 风格、目标等等宏观上的方向：
### 目标： 我要构建一个自动阅读github 的开源项目然后给我掰开了揉碎了讲解的系统。
- 核心痛点：读开源项目太难，代码量大，逻辑复杂。
- 解决方案：用户输入一个 GitHub 仓库 URL，系统通过 AI 自动分析项目架构、生成数据流转图，并提供“指哪打哪”的源码跳转体验。

### 风格
#### 教学原则：
真正的“大师级教学”路径应该是：

- 直觉（Intuition）： 这玩意儿到底是个啥？解决了什么问题？（用生活中的例子类比）
- 心智模型（Mental Model）： 它的骨架长什么样？（架构图、模块划分）
- 核心链路（Critical Path）： 数据怎么流转的？（就像血液怎么流遍全身）
- 代码落地（Code Implementation）： 只有到了这一步，才去看具体的函数和类。

#### 语言风格
用通俗易懂的语言向新人解释复杂系统。 核心任务： 请根据提供的文件结构和依赖文件，为我构建一份“项目导游图”。 要求：
- 拒绝术语堆砌： 不要上来就解释 API，先告诉我这个项目“核心解决了什么业务问题”。

- 模块拟人化： 把核心文件夹比作公司的部门。例如：“/core 是大脑，负责决策；/adapters 是外交部，负责跟外部平台（如微信、Discord）沟通”。

- 技术栈画像： 用一句话解释为什么要选这个库。例如：“这里选 FastAPI 是因为我们要处理高并发的异步请求，而不是因为它‘流行’。”


#### 你要做的事情：
- 1，符合 AGENTS.md规范，一切内容先更新到/vibe 目录。
- 2, 构建一个基于 DeepSeek 的agent 系统，DeepSeek 的 sdk 可以参考这个项目的具体实现。 
- 3，这个项目的理想情况是“让 ai 说人话“，就是让ai真的在教你东西，而不是堆砌难以阅读的技术名词和逻辑。  你应该参考下面的《教学原则》和《针对“意图识别“》
- 4，你构建的是一个全栈 agent 系统


##### 这一步的预期输出：

- 一句话定义： “这是一个基于 LLM 的全栈智能客服系统，能接入微信和 Discord。”
- 架构分层图： (Mermaid 流程图，展示 前端 -> 网关 -> 核心 Agent -> 向量数据库 的层级)。

#### 梳理链路
目标： 通过一个具体的故事，把静态的代码串起来。这是“理解”的关键。 输入： 入口文件 (e.g., main.py) + 核心逻辑控制文件 (e.g., agent.py, router.py)。

- 任务： 接下来，我们要进行“模拟运行”。请你以**“用户发了一句‘帮我查下明天的天气’”**为例，以此为线索，梳理数据在系统中的流转过程。 要求：

- 剧本式叙述： 第一步，消息进入 /gateway，被包装成了什么对象？第二步，/agent 如何决定调用天气工具？

- 关键路标： 在叙述过程中，必须 标出处理该逻辑的核心文件名和函数名。

- 数据变形记： 告诉我数据在流动中发生了什么变化（例如：从 raw string 变成了 JSON 对象）。
##### 预期输出：

- 一个清晰的故事线：消息接收 -> 意图识别 -> 工具调用 -> 结果生成 -> 回复发送。

- Mermaid 时序图： 直观展示各个模块的交互顺序。

#### 针对“意图识别“
任务： 针对上一步提到的核心环节“意图识别”，请解释具体的代码实现。 关键功能： > 1. 逐行解读： 解释这几行代码为什么要这么写（比如：这里为什么要加一个 retry 机制？）。 2. 生成跳转链接： 结合我提供的 GitHub URL eg：nanobot：[https://github.com/HKUDS/nanobot/blob/main/README.md]，为每一段解释附上源码跳转链接。

eg，你直接读取`/Users/mrlonely/mrlonely/mrlonely-code/gitclone/nanobot`当做`https://github.com/HKUDS/nanobot/blob/main`
的内容即可;
```
输出格式示例：
核心函数： decide_action
这个函数通过 prompt chain 判断用户意图。 🔗 点击跳转到源码 (lines 45-50) [https://github.com/HKUDS/nanobot/blob/main/README.md]  (注意这里要改成 markdown 语法)
```






## 具体内容、具体要做的事情
### 系统核心模块
#### 1. 📂 智能目录解析 (Context Pruning)
* 我们需要一个 API，能获取 GitHub 仓库的 `tree`。
* **关键逻辑：** 必须过滤掉 `node_modules`, `.git`, `dist`, `lockfiles` 等垃圾文件，只把核心代码结构喂给 AI。

#### 2. 🧠 架构师 Agent (The Architect)
这是核心的 API Route。他会通过一个循环来实现多轮对话+工具调用（Tool Use）。
##### 1. 核心循环 (The Agent Loop)
Agent 不再接收“整个 Tree”，而是拥有以下 三个工具：
- ls(path): 查看某目录下的一级子文件/子目录（不递归）。
- cat(path): 读取具体文件内容。
- search(keyword): (可选) 基于文件名的模糊搜索。
##### 2. 工作流程图 (The Workflow)
场景模拟： 用户问“分析一下这个项目的鉴权逻辑”。

- Round 1 (Root Level):
    - Agent 思考: “我需要找鉴权（Auth），先看看根目录有什么。”
    - Action: ls("/")
    - Observation: ['src', 'docs', 'package.json', 'README.md']

- Round 2 (Drill Down):
    - Agent 思考: “代码通常在 src 里。”
    - Action: ls("/src")
    - Observation: ['components', 'auth', 'utils', 'api']

- Round 3 (Target Found):
    - Agent 思考: “发现了 auth 目录！这肯定跟鉴权有关。进去看看。”
    - Action: ls("/src/auth")
    - Observation: ['login.ts', 'provider.tsx', 'session.ts']

- Round 4 (Read Code):
    - Agent 思考: “provider.tsx 应该是核心入口，我要读它。”
    - Action: cat("/src/auth/provider.tsx")
    - Output: 拿到代码，开始分析数据流。
##### 技术落地：如何实现这套“动态修剪”？
需要在后端（有限使用 server 里面的基于 hono的后端）实现一套 智能文件过滤器
步骤 1： 智能 Tree 生成器 (The Smart Pruner)
示例代码。
```js
// github-tree.ts
/**
 * 策略：
 * 1. 默认只返回当前层级 (Depth=1)
 * 2. 只有当 Agent 请求 "expand" 时，才加载下一层
 * 3. 必须有一个黑名单，直接在 API 层屏蔽垃圾
 */
const IGNORE_PATTERNS = [
  'node_modules', '.git', 'dist', 'build', '.next', 
  'yarn.lock', 'package-lock.json', 
  '**/*.png', '**/*.jpg', '**/*.svg' // 忽略资源文件
];

export async function getDirectoryContent(owner, repo, path = '') {
  // 调用 GitHub API 获取指定 path 的内容 (不是 recursive tree)
  const { data } = await octokit.rest.repos.getContent({
    owner, repo, path
  });
  
  // 简单清洗，只返回 name 和 type (file/dir)
  return data.map(item => ({
    name: item.name,
    type: item.type, // 'file' | 'dir'
    path: item.path
  }));
}
```

步骤 2： 定义 Agent 的 Tools (Vercel AI SDK Core)
使用 Vercel AI SDK 的 tool() 方法，让 LLM 自己决定怎么走。
示例代码
```js
import { generateText, tool } from 'ai';
import { z } from 'zod';
import { getDirectoryContent, getFileContent } from '@/lib/github';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await generateText({
    model: openai('deepseek-chat'),
    tools: {
      // 工具 1: 查看目录 (相当于 cd + ls)
      listDir: tool({
        description: '查看某个目录下的文件列表。当你不知道文件在哪里时，先用这个。',
        parameters: z.object({ path: z.string().describe('目录路径，根目录用 ""') }),
        execute: async ({ path }) => await getDirectoryContent(repo, path),
      }),
      
      // 工具 2: 读取文件 (相当于 cat)
      readFile: tool({
        description: '读取单个文件的具体代码内容。只有当你确定这个文件很重要时才用。',
        parameters: z.object({ path: z.string() }),
        execute: async ({ path }) => await getFileContent(repo, path),
      }),
    },
    system: `
      你是一个代码审计 Agent。
      你的目标是通过“探索”文件系统来回答用户关于架构的问题。
      不要试图一次性读取所有文件。
      
      策略：
      1. 先看根目录。
      2. 根据文件名猜测核心逻辑在哪里。
      3. 一步步深入，直到找到关键代码。
      4. 最终输出分析结果。
    `,
    messages,
    maxSteps: 10, // 允许 Agent 自动执行 10 步探索操作
  });

  return result;
}
```
##### 进阶优化：跑demo暂时不做：
给 Agent 一个“地图索引” (Summarization Map)
如果项目真的巨大（比如 Linux Kernel），光靠 ls 也很慢。 你需要引入 "MapReduce" 思想：
- 预处理 (Pre-indexing)：
    - 对于大项目，你可以先跑一个轻量级脚本（比如用 ctags 或者简单的 AST parser），提取出 “符号表” (Symbol Table)。
    - 生成一个 skeleton.json，里面只包含：类名、函数名、文件路径。不包含具体代码。
- 投喂骨架：
    - 一开始就把这个 skeleton.json (可能只有几百 KB) 喂给 Agent。
    Agent 就能直接说：“哦，我看到 AuthService 类在 src/services/auth.ts 里，我直接读取这个文件。”

省去了漫无目的的 ls 探索过程。

#### 可以用的工具
- tree 命令可以查看当前文件结构，但是注意！！！你要记得过滤各种 .*(比如.next 和.vercel以及 dist 和)文件和 `node_modules`文件。

#### 技术栈：
已有的技术参考 package.json即可，没有的技术后面再说。





## 最麻烦的一个点，怎么读！！！！

我们先做一个模块吧，就是做 agent 去读取整个项目这个功能，教我怎么做？ 在一个体量爆炸的项目上，怎么做？
AI 怎么知道在什么去读？我们加一堆 bash 的 tool 然后让AI 循环去读？啊？
以及，读完怎么存？在什么时机去调用 AI？
codex 和 Claude code 是怎么做的？
感觉只要解决了这个“读”的问题，别的都好说。

#### 谷歌地球：
- 卫星视角 (The Skeleton): 只看大洲和国家（文件树 + 核心符号）。

- 航拍视角 (The Summary): 看城市轮廓（文件摘要 + 接口定义）。

- 街景视角 (The Content): 只有真正走到那条街，才加载那里的高清贴图（具体代码实现）。

##### 第一步：建立“骨架索引” (The Skeleton) —— 这是必须做在 AI 介入之前的
不要让 AI 去 ls -R。 这太慢太笨了。 你需要用 AST (抽象语法树) 工具，在毫秒级内提取出项目的骨架。
工具选型： Tree-sitter (最强，支持所有语言) 或 ctags (简单粗暴)。

提取内容： 我们不读函数体里面的代码，只读 “签名 (Signature)”。
生成的 skeleton.json 应该是这样的： (这几万行代码，压缩后可能只有 20KB)

JSON
{
  "src/auth/auth.service.ts": {
    "type": "file",
    "symbols": [
      "class AuthService",
      "method login(user: User, pass: string): Promise<string>",
      "method validateUser(payload: JwtPayload): boolean"
    ]
  },
  "src/database/schema.prisma": {
    "type": "file",
    "symbols": ["model User", "model Post"]
  }
}
✅ 这一步解决了“AI 怎么知道去哪读”的问题： AI 还没开始读代码，手里就已经有了一份“地图”。它看到 AuthService 类和 login 方法，就知道“鉴权逻辑肯定在这里”，而不是去翻 utils 文件夹。

##### 第二步：Agent 的“探针”设计 (The Reader Tools)
现在轮到 AI 上场了。不要给它 bash，给它封装好的 高级工具。

关键工具集：

- search_skeleton(query):
  - 不是搜全文，是搜刚才生成的 skeleton.json。
  - Prompt: "Project uses JWT? Let me search symbols..." -> 命中 AuthService。

- read_interface(path):
  - 这个最关键！ 类似于 TypeScript 的 .d.ts 或 Python 的 .pyi。
  - 它只返回文件的 import、class 定义、函数名、注释。它会把函数体 { ... } 替换成 // ... implementation hidden。
  - 作用： 让 AI 极速了解这个文件是干嘛的，而不消耗 Token 看细节。

- read_implementation(path, line_start, line_end):
  - 只有当 AI 确定“就是这个函数有问题”时，才调用这个工具，读取具体的 50 行代码。

##### 第三步：状态机与循环 (The Brain Loop)
怎么防止 AI 瞎转悠？你需要给 Agent 植入一个 “假设-验证” 的思维链（CoT）。
工作流（Workflow）：

用户提问： “这个项目的登录逻辑是怎么样的？”

初始化： 加载 skeleton.json 进 System Prompt（如果太大，就用 RAG 检索）。

  Round 1 (定位):
  AI 思考: “登录通常和 Auth 有关。”
  Action: search_skeleton("Auth") 或 search_skeleton("Login")
  Result: 发现 src/services/auth.ts。

  Round 2 (概览):
  AI 思考: “我看下 auth.ts 的结构。”
  Action: read_interface("src/services/auth.ts")
  Result: 看到 login() 方法调用了 userRepo.find() 和 jwt.sign()。

  Round 3 (深究):
  AI 思考: “核心是 jwt.sign，我想看它传了什么参数。”
  Action: read_implementation("src/services/auth.ts", "login")
  Result: 拿到那 10 行关键代码。

输出结论。

##### 第四步：读完怎么存？(The Memory)

读过的东西不能扔，下次用户问“注册逻辑”时，AI 应该记得“哦，我看过 User 模型了”。

- 短期记忆 (Session Context):
把 Agent 的 思考过程 (Thoughts) 和 工具返回的关键摘要 保存在当前的对话 History 里。

- 长期记忆 (Knowledge Graph / Vector DB):
高配做法 (Cursor/Claude Code): 当 Agent 读完一个文件后，让它生成一个 Summary(Summay 要包含关键信息啊，起码得是前面工具能获取的信息)，存入向量数据库 (Vector DB)。

下次搜索时，先搜 Vector DB。

例子: src/utils/hash.ts -> Vector: "包含 bcrypt 密码加密 helper 函数"。