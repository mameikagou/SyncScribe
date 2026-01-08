import os
from typing import List

from fastapi import APIRouter, HTTPException
from openai import AsyncOpenAI
from pydantic import BaseModel, Field
from pydantic_ai import Agent
from pydantic_ai.messages import BinaryContent
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider

from .image_utils import decode_base64_image, load_image_from_source

router = APIRouter()

DASHSCOPE_API_KEY = os.getenv("DASHSCOPE_API_KEY")
DASHSCOPE_COMPAT_BASE_URL = os.getenv(
    "DASHSCOPE_COMPAT_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1"
)

if not DASHSCOPE_API_KEY:
    print("警告: 未找到 DASHSCOPE_API_KEY 环境变量")

dashscope_client = AsyncOpenAI(
    api_key=DASHSCOPE_API_KEY,
    base_url=DASHSCOPE_COMPAT_BASE_URL,
)
dashscope_provider = OpenAIProvider(openai_client=dashscope_client)


class PydanticAISentimentRequest(BaseModel):
    text: str
    # 兼容原有字段，自动下载并转为 base64
    image_urls: List[str] = []
    # 可传入本地文件路径或 URL，也会转为 base64
    image_sources: List[str] = []
    # 已有的 base64 或 data URI
    image_base64: List[str] = []


class SentimentAnalysis(BaseModel):
    summary: str
    sentiment_score: float = Field(ge=0, le=10)
    sentiment_keywords: List[str]
    user_persona: str
    pain_points: List[str]
    gain_points: List[str]
    marketing_suspicion: str
    verdict: str


sentiment_agent = Agent(
    model=OpenAIChatModel("qwen3-vl-flash", provider=dashscope_provider),
    system_prompt=(
        "你是一名专业的消费市场分析师。综合文本与可访问的图片链接，给出简洁的商业价值分析。"
        "直接输出 JSON，字段需满足定义的 Pydantic Schema。"
    ),
    output_type=SentimentAnalysis,
)


def _gather_images(request: PydanticAISentimentRequest) -> List[BinaryContent]:
    binaries: List[BinaryContent] = []
    errors: List[str] = []

    def add_image(data: bytes, media_type: str, identifier: str) -> None:
        binaries.append(BinaryContent(data=data, media_type=media_type, identifier=identifier))

    for src in [*request.image_urls, *request.image_sources]:
        try:
            data, media_type = load_image_from_source(src)
            add_image(data, media_type, src)
        except Exception as exc:  # noqa: BLE001
            errors.append(f"图片获取失败: {src} -> {exc}")

    for idx, b64 in enumerate(request.image_base64):
        try:
            data, media_type = decode_base64_image(b64)
            add_image(data, media_type, f"base64-{idx}")
        except Exception as exc:  # noqa: BLE001
            errors.append(f"base64 解析失败: index {idx} -> {exc}")

    if errors:
        raise HTTPException(status_code=400, detail="; ".join(errors))

    return binaries


@router.post("/api/vibe/pydanticai/sentiment")
async def analyze_sentiment_with_pydantic_ai(request: PydanticAISentimentRequest):
    if not DASHSCOPE_API_KEY:
        raise HTTPException(status_code=500, detail="缺少 DASHSCOPE_API_KEY 环境变量")

    binary_images = _gather_images(request)

    prompt = (
        "用户文本：\n"
        f"{request.text}\n\n"
        f"图片数量：{len(binary_images)}\n"
        "请按 JSON 返回，不要使用 Markdown 代码块。"
    )

    user_message = [prompt, *binary_images]

    try:
        result = await sentiment_agent.run(user_message)
        return result.output
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        print(f"pydanticai 调用失败: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))
