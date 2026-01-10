针对 Next.js API (fe-next/apps/web/app/api和fe-next/apps/web/app/api/vibe)
Prompt: "你现在是一位资深后端工程专家。请分析 fe-next/apps/web/app/api 和 fe-next/apps/web/app/api/vibe 目录下接口文件的逻辑（包括 Request 类型定义、Zod 校验和返回结构）。

要求：

在文件最顶层添加一个块注释（Block Comment）。

文档结构包含：

Endpoint Description: 简述接口功能。

Request Example: 完整的 JSON 请求体示例。

Response Example: 包含成功（200）和典型失败（400/500）的 JSON 示例。

Test Command: 一个可以直接复制并在终端运行的 curl 命令（包含 Header、Method 和 Body，URL 使用 localhost:3000）。

注意：请严格保持原有的业务代码不动，只在文件顶部添加注释。"

针对 Python Service (fe-next/apps/python-service)
Prompt: "作为 Python 架构师，请为 vibe 目录下的接口（FastAPI/Flask）生成标准文档。

要求：

在函数或文件定义上方，使用 Python 标准的 """Docstring""" 格式。

文档结构包含：

JSON Request: 根据 Pydantic 模型推断出的字段。

JSON Response: 包含嵌套结构的返回值示例。

Curl Command: URL 默认使用 localhost:8000。

注意：推理代码中的逻辑错误并在文档中给出准确的 Status Code 说明。"

三、 生成的效果示例（预览）
运行后，你的代码顶部应该长这样：

TypeScript

/**
 * @endpoint POST /api/finance/analyze
 * @description 根据大A行情数据生成 AI 分析总结
 * * @request
 * {
 * "symbol": "SH000001",
 * "days": 7
 * }
 * * @response_200
 * {
 * "status": "success",
 * "summary": "今日大盘在政策利好下强势反弹...",
 * "trend": "bullish"
 * }
 * * @test
 * curl -X POST http://localhost:3000/api/finance/analyze \
 * -H "Content-Type: application/json" \
 * -d '{"symbol": "SH000001", "days": 7}'
 */