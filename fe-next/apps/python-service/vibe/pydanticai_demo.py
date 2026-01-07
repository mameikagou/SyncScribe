import os
from typing import List

from fastapi import APIRouter, HTTPException
from openai import AsyncOpenAI
from pydantic import BaseModel, Field
from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider

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
    image_urls: List[str] = []


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


@router.post("/api/vibe/pydanticai/sentiment")
async def analyze_sentiment_with_pydantic_ai(request: PydanticAISentimentRequest):
    if not DASHSCOPE_API_KEY:
        raise HTTPException(status_code=500, detail="缺少 DASHSCOPE_API_KEY 环境变量")

    images_block = "\n".join(f"- {url}" for url in request.image_urls) or "无"
    prompt = (
        "用户文本：\n"
        f"{request.text}\n\n"
        "图片 URL：\n"
        f"{images_block}\n\n"
        "请按 JSON 返回，不要使用 Markdown 代码块。"
    )

    try:
        result = await sentiment_agent.run(prompt)
        return result.output
    except Exception as exc:
        print(f"pydanticai 调用失败: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))
