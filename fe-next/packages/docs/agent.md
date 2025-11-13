## Agent 角色概览

### 1. 🕵️‍♂️ 趋势侦探（The Trend Hunter Agent）

- 人设：精通社交媒体风向、擅长读图的市场分析师。
- 职责：
   - 分析用户提供的帖子链接或上传内容。
   - 理解图片中的产品细节与红黑榜信息。
   - 总结评论区的情绪与核心讨论点。
- 工具：
   - `analyze_post_content(url)`: 调用 Python 后端完成爬取与 OCR。
   - `extract_sentiment(text)`: 对文本内容进行情感分析。
- 典型场景：
   > 用户询问“这款面霜在小红书上的口碑如何？”Agent 在读图工具中发现大量“搓泥”反馈，最终总结“保湿表现不错，但搓泥问题严重”。

### 2. 📊 金融宽客（The Quant Agent）

- 人设：严谨、数据驱动的基金经理，只相信数字。
- 职责：
   - 获取实时股价、P/E、P/B 等关键指标。
   - 查询历年财报数据（营收、净利润等）。
   - 进行简单量化分析，如计算过去 30 天平均涨幅。
- 工具：
   - `get_stock_price(ticker)`: 基于 yfinance 或 Tushare 获取实时行情。
   - `get_financial_report(ticker, year)`: 查询数据库中的财报数据。
   - `rag_search_reports(query)`: 使用向量数据库检索研报内容。
- 典型场景：
   > 用户询问“平安银行当前估值是否偏低？”Agent 获取实时 PE 为 4.5，并结合历史数据判定当前位于 10% 分位点，给出“估值非常低”的结论。

### 3. ✍️ 首席主编（The Editor Agent）

- 人设：擅长排版、总结、制作可视化内容的编辑。
- 职责：
   - 负责如何展示数据，而非搜集数据。
   - 决定何时使用图表、表格或文本形式呈现内容。
   - 将精选内容插入协同文档，保持结构清晰。
- 工具：
   - `generate_stock_card(data)`: 生成富组件（Generative UI）。
   - `insert_to_document(content_json)`: 操作 Tiptap 编辑器，插入合集卡片或文本块。
- 典型场景：
   > 用户要求“把刚才面霜的优缺点整理成卡片并写入文档”，Agent 先调用 `generate_stock_card` 预览，再执行 `insert_to_document` 完成落稿。

## Router 模式架构实现

- 单一 LLM（如 `DeepSeek` 或 `Qwen`）通过 Vercel AI SDK 的 Router 模式挂载全部工具。
- Agent 通过工具组合完成不同角色的职责，LLM 负责在对话中调度与决策。
- 关键实现位于 `app/api/chat/route.ts`：

```ts
const result = await streamText({
   model: qwen('qwen-vl-max'),
   messages,
   system: '你是一个金融投研助手。你可以分析社交媒体趋势，也可以查询硬核金融数据。',
   tools: {
      analyzeXhsPost: tool({
         description: '分析小红书帖子内容和图片',
         parameters: z.object({ url: z.string() }),
         execute: async ({ url }) => { /* 调用 Python 服务 */ },
      }),
      getStockPrice: tool({
         description: '获取股票实时价格',
         parameters: z.object({ ticker: z.string() }),
         execute: async ({ ticker }) => { /* 调用 Python 服务 */ },
      }),
      insertToDoc: tool({
         description: '将内容插入到右侧文档编辑器中',
         parameters: z.object({ text: z.string(), images: z.array(z.string()) }),
         // 前端执行具体插入逻辑
      }),
   },
});
```

- 总结：LLM 搭配一组设计良好的 Python/JS 函数即可成为“超级助理”。它既能理解社交媒体内容、完成金融量化分析，又能把结论以富文本形式写入协作文档。

## 趋势侦探的分析维度

### 用户画像推断（Persona Profiling）

- 通过图片滤镜、背景、穿搭与文字语气推断发帖人类型，例如：价格敏感的学生党、关注成分的功效党、准备送礼的男性用户。
- 价值：帮助品牌快速锁定产品受众。

### 痛点与爽点提取（Pain / Gain Points）

- 要求提取具体描述，而非笼统好评，例如：爽点评价“肤感像冰淇淋”，痛点评价“泵头难按”。
- 价值：为产品改进与投研提供更细粒度的依据。

### 营销痕迹检测（Marketing Detection）

- 判断帖子是“真实分享”还是“疑似广告”，指标包括关键词密度、图片是否重度修饰、是否存在典型带货话术。
- 价值：提前剔除噪声数据，提升后续分析准确度。

## 技术实现方案：趋势侦探 Agent

- 架构选择：Next.js 负责路由与 UI，Python 服务负责视觉处理与多模态分析。
- 流程概述：
   1. 用户在聊天框上传图片并粘贴文本。
   2. Next.js 将图片暂存至 Vercel Blob（或其他对象存储），获取可访问的 URL。
   3. `ai/streamText` 根据用户意图选择调用 `analyze_sentiment` 等工具。
   4. Python FastAPI 接收 `{ text, imageUrls }`，调用多模态模型（如 `Qwen-VL`）完成分析并返回 JSON。
   5. Next.js 使用 `generateUI` 渲染 `<SentimentCard />` 等组件，将结论展示给用户或写入协同文档。