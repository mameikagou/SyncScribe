第一阶段：基础设施与数据层准备 (Infrastructure & Data Layer)
此阶段侧重于为新的“记忆银行”和“多模态分析”打好基础。

[ ] 数据库 Schema 设计 (Prisma)

在 packages/tools (或合适的位置) 初始化 Prisma。

定义 Suggestion (建议) 模型：存储结构化的博主建议。

定义 Memory/RAG 模型：用于存储向量化数据或历史上下文。

[ ] 文件存储配置

✅配置 Vercel Blob 或 AWS S3 环境变量。

验证 Next.js 端的文件上传 API (app/api/upload/route.ts) 是否可用。

[ ] Python 环境配置

更新 apps/python-service/requirements.txt，添加多模态模型库 (e.g.,
google-generativeai, dashscope) 和数据库连接库。

第二阶段：Python 微服务开发 (Python Service - The Brain)
此阶段专注于实现核心的分析逻辑，处理“无头”计算任务。

[ ] 多模态分析接口开发

在 apps/python-service/main.py 中新增 API 端点 /analyze。

实现 analyze_uploaded_content 逻辑：接收文本 + 图片 URL。

集成 LLM (Gemini/Qwen) 进行 OCR 和语义理解。

[ ] 结构化提取逻辑

编写 Prompt 策略，确保 LLM 输出严格的 JSON 格式（用于提取博主建议）。

[ ] RAG 向量化服务

实现将提取出的 JSON 数据进行向量化处理的逻辑 (使用 ChromaDB 或 PGVector)。

第三阶段：Next.js 后端与 BFF 层 (Next.js Backend & Tools) 此阶段负责编排 Agent
的行为，连接前端与 Python 服务。

[ ] Vercel AI SDK Tool 定义

在 app/api/chat/route.ts 中定义 analyzePost 工具。

实现工具逻辑：调用 Python 微服务的 /analyze 接口。

实现工具逻辑：调用 Prisma 将结果存入 Postgres 数据库。

[ ] 记忆检索工具

实现 searchMemory 工具：根据用户问题查询 Postgres 中的历史建议/数据。

第四阶段：前端 UI 与交互 (Frontend UI/UX) 此阶段负责用户可见的交互组件。

[ ] 多模态上传组件

完善 apps/web/components/ChatInput.tsx (或相关组件)，支持图片/文件拖拽上传。

集成 use-file-upload.ts hook，处理上传并获取 URL。

[ ] 生成式 UI (generateUI) 响应

设计“分析报告卡片”组件：用于展示 Python 服务返回的结构化建议。

在 app/page.tsx (Agent 界面) 适配该组件的渲染。

[ ] 趋势分析/记忆看板 (可选)

创建一个新的页面或 Dashboard 区域，用于展示从数据库中聚合的“趋势分析”结果。

第五阶段：协同与整合 (Collaboration & Integration)
此阶段确保原有功能与新功能共存。

[ ] 协同编辑器集成验证

确保 apps/partykit 服务运行正常。

验证从 Chat 界面生成的富组件能否正确引导至 doc/[id] 页面。

[ ] 端到端测试

测试完整链路：上传图片 -> 分析 -> 存库 -> Chat 界面展示结果 -> 存入记忆银行。
