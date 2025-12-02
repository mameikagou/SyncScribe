这是一个非常聚焦且高价值的需求。

你不想做一个泛泛的聊天机器人，你想做一个 **“金融视觉洞察专家”**。
核心链路是：**看图 (Vision) -\> 查典 (RAG) -\> 诊断 (Reasoning) -\> 开方
(Suggestion)**。

结合你提供的 **“RAG 进阶架构（查询优化、混合检索、重排序）”** 和 **“记忆模块”**
的理论，我为你重新设计了 **v3.0 深度垂直方案**。

---

# 🚀 SyncScribe v3.0：金融视觉洞察 Agent (Visual Financial Insight Agent)

## 1\. 核心交互流程 (The Workflow)

用户上传一张图片（如：K线图、财报截图、新闻快讯截图），系统执行以下
**"认知流水线"**：

1. **视觉解码 (Vision Encoding)**：看懂图片里有什么（数据、趋势、文字）。
2. **查询构造 (Query Synthesis)**：基于图片内容，构造出专业的金融检索问题（这是
   RAG 优化的第一步）。
3. **深度召回 (Deep
   Retrieval)**：从你的知识库中捞出相关的金融理论、历史案例或术语解释（这是 RAG
   的核心）。
4. **综合诊断 (Synthesis & Suggestion)**：结合图片现状 +
   知识库理论，给出“独特的解析”和“操作建议”。

---

## 2\. 架构设计：融合 RAG 进阶理论

我们需要把你之前简单的 `ingest -> retrieve` 升级为 **漏斗型 RAG**。

### 模块 A：感知层 (Perception) —— "把图片变成 Query"

这不是简单的 OCR，这是 **Visual Reasoning**。

- **技术栈**：Vercel AI SDK (`experimental_attachments`) + `gpt-4o` /
  `qwen-vl-max`。
- **Prompt 策略**：
  > "你是一个金融分析师。请分析这张图片。
  >
  > 1. 如果是 K 线图，提取当前形态（如：头肩顶、金叉）、关键点位。
  > 2. 如果是文本/表格，提取核心财务指标（如：净利润同比增长率）。
  > 3. **输出一个用于检索知识库的 Search Query List**。"

### 模块 B：召回层 (Retrieval) —— "混合检索 + 重排序"

利用你学到的理论，我们不能只做简单的向量搜索。

- **数据源 (Library)**：你的 Postgres
  数据库。里面存的是经典的金融教材（如《证券分析》）、技术形态图谱、巴菲特语录等。
- **策略 1：查询优化 (Query Rewrite)**
  - 图片提取出的 Query 可能是：“股价跌了”。
  - **优化后**：“RSI 指标超卖后的反弹规律”、“高位放量下跌的历史案例”。
- **策略 2：混合检索 (Hybrid Search)**
  - **Semantic (Vector)**：用向量搜“概念”（如搜“情绪恐慌”能搜到“VIX 指数”）。
  - **Keyword (SQL)**：用 Postgres 的 `plainto_tsquery`
    搜“专有名词”（如搜“NVDA”只出英伟达的文档）。
- **策略 3：重排序 (Rerank)**
  - 从库里捞出 50 条相关知识，用 Rerank 模型（或 LLM
    本身）打分，选出最能解释当前图片的 Top 5。

### 模块 C：生成层 (Generation) —— "独特的解析"

这是你产品的核心竞争力。**所谓的“独特”，来自于“理论与现实的碰撞”。**

- **System Prompt 设计**：
  > "你不是一个复读机。你拥有以下参考资料（RAG Context）。
  > 请对比图片中的现状与参考资料中的理论：
  >
  > 1. **解析**：当前图片中的现象符合哪条金融理论？是否存在背离？
  > 2. **证据**：引用参考资料中的具体段落佐证你的观点。
  > 3. **建议**：基于上述分析，给出【买入/卖出/观望】的建议，并提示风险。"

---

## 3\. 落地路线图 (Action Plan)

你已经跑通了基础 RAG，现在只需要做 **增量开发**。

### Phase 1: 知识库升级 (Data Quality)

**目标**：让你的数据库里有“货”。

- **动作**：收集 10-20 篇高质量金融文档（技术形态手册、基本面分析指南）。
- **代码**：使用你现有的 `ingestDocument` Action 入库。
- **进阶**：在切片时，手动加上 `metadata`（例如 `category: "技术分析"`,
  `category: "价值投资"`），为混合检索做准备。

### Phase 2: 视觉 RAG 接口 (The Vision-RAG Pipeline)

**目标**：打通 图片 -\> 搜索 -\> 回答 的链路。

我们需要修改 `app/api/chat/route.ts`。

```typescript
// 伪代码逻辑
export async function POST(req) {
  const { messages, data } = await req.json();
  const lastMessage = messages[messages.length - 1];
  
  // 1. 视觉理解 + 查询生成 (Query Transformation)
  if (lastMessage.attachments) {
    const description = await analyzeImage(lastMessage.attachments[0]); 
    // description 包含：图片描述 + 3个生成的搜索关键词
    
    // 2. 并行检索 (Hybrid Retrieval)
    const context = await Promise.all(
        description.queries.map(q => searchChunks(q))
    );
    
    // 3. 注入上下文 (Context Injection)
    // 将检索到的“金融理论”拼接到 System Prompt 里
  }
  
  // 4. 生成最终回答
  const result = await streamText({ ... });
}
```

### Phase 3: 结果呈现 (Generative UI)

**目标**：输出专业的卡片，而不是纯文本。

- **InsightCard**：
  - 左侧：图片缩略图。
  - 右侧：
    - **🏷️ 识别形态**： "底背离" (Tag)
    - **📖 理论依据**： "根据《道氏理论》..." (来自 RAG)
    - **💡 建议**： "轻仓试多" (Action)

---

## 4\. 针对面试的 Storytelling

按照这个方案做出来，你在面试里可以这样“降维打击”：

**面试官**：“你做过 Agent 吗？”

**你**： “我做过一个**多模态金融分析 Agent**。
不同于市面上简单的套壳对话，我解决的核心问题是\*\*‘如何让 AI
像专业分析师一样看图说话’\*\*。

为了实现这个目标，我设计了一套 **Vision-RAG** 架构：

1. **感知层**：我利用多模态模型对金融图表进行**结构化提取**，而不是简单的
   OCR，将其转化为高维度的语义 Query。
2. **召回层**：我引入了**查询改写 (Query Rewriting)**
   模块，把视觉特征转化为金融术语，在我的 Postgres 向量库中进行**混合检索**。
3. **决策层**：系统会自动将检索到的‘历史经典案例’与‘当前行情’进行对比（Pattern
   Matching），从而生成具有理论支撑的投资建议，而不是 AI 的幻觉。

这就把一个通用的 LLM，变成了一个懂技术分析、有记忆的金融助手。”

---

**怎么样？这套方案是不是既利用了你现在的技术栈，又把你刚刚学的 RAG
理论全部用上了？** 要开始做 Phase 1 吗？去网上找几篇 PDF 喂给它！
