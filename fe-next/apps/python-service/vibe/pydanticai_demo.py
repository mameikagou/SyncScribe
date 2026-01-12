"""JSON Request:
{
    "text": "分析这段社交媒体文案",
    "image_urls": ["https://example.com/promo.png"],
    "image_sources": ["/path/to/local.png"],
    "image_base64": ["data:image/png;base64,iVBORw0KGgo..."]
}

JSON Response (200):
{
    "summary": "用户文案核心观点…",
    "sentiment_score": 8.6,
    "sentiment_keywords": ["新品", "优惠"],
    "user_persona": "价格敏感的学生群体",
    "pain_points": ["价格略高", "等待配送"],
    "gain_points": ["限时折扣", "赠品丰富"],
    "marketing_suspicion": "中",
    "verdict": "买入"
}

JSON Response (400):
{"detail": "图片获取失败: https://example.com/promo.png -> 404 Client Error"}

JSON Response (500):
{"detail": "缺少 DASHSCOPE_API_KEY 环境变量"}

Curl Command:
curl -X POST http://localhost:8000/api/vibe/pydanticai/sentiment \\
  -H \"Content-Type: application/json\" \\
  -d '{\"text\":\"分析这段社交媒体文案\",\"image_urls\":[\"https://example.com/promo.png\"]}'
"""
import os  # 读取环境变量（API Key、Base URL 等配置）
from typing import List  # 类型注解：列表

from fastapi import APIRouter, HTTPException  # FastAPI 路由与标准异常
from openai import AsyncOpenAI  # OpenAI 官方 async 客户端（兼容 DashScope OpenAI 模式）
from pydantic import BaseModel, Field  # Pydantic 数据模型与字段校验
from pydantic_ai import Agent  # Pydantic AI 的核心 Agent 抽象
from pydantic_ai.messages import BinaryContent  # 用于携带图片等二进制内容的消息格式
from pydantic_ai.models.openai import OpenAIChatModel  # 封装 OpenAI Chat 接口的模型定义
from pydantic_ai.providers.openai import OpenAIProvider  # 适配 OpenAI 协议的 Provider（可替换后端）

from .image_utils import decode_base64_image, load_image_from_source  # 本地工具函数，处理图片下载与 Base64

# 创建 FastAPI 路由器，挂载接口路径
router = APIRouter()

# 从环境变量读取达摩盘（DashScope）兼容的 OpenAI Key 与 Base URL
DASHSCOPE_API_KEY = os.getenv("DASHSCOPE_API_KEY")
DASHSCOPE_COMPAT_BASE_URL = os.getenv(
    "DASHSCOPE_COMPAT_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1"
)

# 提前提醒缺少 Key，方便部署时排查
if not DASHSCOPE_API_KEY:
    print("警告: 未找到 DASHSCOPE_API_KEY 环境变量")

# 初始化异步 OpenAI 客户端，底层走 DashScope 兼容模式
dashscope_client = AsyncOpenAI(
    api_key=DASHSCOPE_API_KEY,
    base_url=DASHSCOPE_COMPAT_BASE_URL,
)
# 将客户端包装成 Provider，便于在 Pydantic AI 的 Agent 中注入
dashscope_provider = OpenAIProvider(openai_client=dashscope_client)


class PydanticAISentimentRequest(BaseModel):
    text: str  # 输入的用户文本
    # 兼容原有字段：在线图片 URL，会被下载后转 Base64
    image_urls: List[str] = []
    # 可传本地路径或 URL，同样会被读取并转 Base64
    image_sources: List[str] = []
    # 已经准备好的 Base64 或 data URI，直接解码
    image_base64: List[str] = []


class SentimentAnalysis(BaseModel):
    # 输出的情绪/商业分析结构
    summary: str  # 总结
    sentiment_score: float = Field(ge=0, le=10)  # 0-10 的情绪得分，使用 Field 校验范围
    sentiment_keywords: List[str]  # 关键词
    user_persona: str  # 用户画像
    pain_points: List[str]  # 痛点
    gain_points: List[str]  # 亮点/收获点
    marketing_suspicion: str  # 是否有营销嫌疑
    verdict: str  # 结论


# 构造一个 Pydantic AI Agent，绑定模型、系统提示和输出 Schema
sentiment_agent_flash = Agent(
    model=OpenAIChatModel(
        "qwen3-vl-flash", provider=dashscope_provider
    ),  # 选用通义千问多模态版本
    system_prompt=(
        "你是一名专业的消费市场分析师。综合文本与可访问的图片链接，给出简洁的商业价值分析。"
        "直接输出 JSON，字段需满足定义的 Pydantic Schema。"
    ),
    output_type=SentimentAnalysis,  # 要求返回的结构体类型，Agent 会自动校验/解析
)
sentiment_agent_plus = Agent(
    model=OpenAIChatModel(
        "qwen3-vl-plus", provider=dashscope_provider
    ),  # 选用通义千问多模态版本
    system_prompt=(
        "你是一名专业的消费市场分析师。综合文本与可访问的图片链接，给出简洁的商业价值分析。"
        "直接输出 JSON，字段需满足定义的 Pydantic Schema。"
    ),
    output_type=SentimentAnalysis,  # 要求返回的结构体类型，Agent 会自动校验/解析
)

def _gather_images(request: PydanticAISentimentRequest) -> List[BinaryContent]:
    binaries: List[BinaryContent] = []  # 收集整理后的图片二进制
    errors: List[str] = []  # 记录处理过程中出现的错误

    def add_image(data: bytes, media_type: str, identifier: str) -> None:
        # BinaryContent 是 Pydantic AI 传递图像的载体，包含二进制、MIME、标识符
        binaries.append(BinaryContent(data=data, media_type=media_type, identifier=identifier))

    # 先处理 URL 和本地路径：统一读成二进制
    for src in [*request.image_urls, *request.image_sources]:
        try:
            data, media_type = load_image_from_source(src)  # 根据来源自动下载/读取文件
            add_image(data, media_type, src)
        except Exception as exc:  # noqa: BLE001 - 保留广泛捕获，记录后统一返回
            errors.append(f"图片获取失败: {src} -> {exc}")

    # 再处理直接传入的 Base64 / data URI
    for idx, b64 in enumerate(request.image_base64):
        try:
            data, media_type = decode_base64_image(b64)  # 解码并拿到 MIME
            add_image(data, media_type, f"base64-{idx}")
        except Exception as exc:  # noqa: BLE001
            errors.append(f"base64 解析失败: index {idx} -> {exc}")

    # 若有任何错误，统一抛出 400，提示前端具体原因
    if errors:
        raise HTTPException(status_code=400, detail="; ".join(errors))

    return binaries


@router.post("/api/vibe/pydanticai/sentiment")
async def analyze_sentiment_with_pydantic_ai(request: PydanticAISentimentRequest):
    # 运行时再次校验 Key，防止启动时缺失、热更新等导致的问题
    if not DASHSCOPE_API_KEY:
        raise HTTPException(status_code=500, detail="缺少 DASHSCOPE_API_KEY 环境变量")

    binary_images = _gather_images(request)  # 整理所有图片为 BinaryContent 列表

    # 构造用户消息：文本 + 图片数量提示，要求直接返回 JSON
    prompt = (
        "用户文本：\n"
        f"{request.text}\n\n"
        f"图片数量：{len(binary_images)}\n"
        "请按 JSON 返回，不要使用 Markdown 代码块。"
    )

    user_message = [prompt, *binary_images]  # Pydantic AI 支持消息数组，包含字符串与 BinaryContent

    try:
        result = await sentiment_agent_flash.run(
            user_message
        )  # 调用 Agent，自动完成模型推理与结构化解析
        return result.output  # 输出已经符合 Pydantic Schema 的数据
    except HTTPException:
        raise  # 已经是 HTTPException 的直接透传
    except Exception as exc:  # noqa: BLE001
        print(f"pydanticai 调用失败: {exc}")  # 打印日志便于排查
        raise HTTPException(status_code=500, detail=str(exc))
