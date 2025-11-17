import os
import json
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Header
from dotenv import load_dotenv
from pydantic import BaseModel
import dashscope
from http import HTTPStatus


load_dotenv()

# 配置阿里云 Key (从环境变量获取)
DASHSCOPE_API_KEY = os.getenv("DASHSCOPE_API_KEY")
print(DASHSCOPE_API_KEY)

if not DASHSCOPE_API_KEY:
    print("警告: 未找到 DASHSCOPE_API_KEY 环境变量")
dashscope.api_key = DASHSCOPE_API_KEY

app = FastAPI()


# 2. 定义请求的数据结构
class SentimentRequest(BaseModel):
    text: str
    image_urls: List[str] = []


@app.post("/api/analyze/sentiment")
async def analyze_sentiment(request: SentimentRequest):
    print(
        f"收到分析请求: Text length={len(request.text)}, Images={len(request.image_urls)}"
    )
    # 构造 Prompt，强制要求 JSON 格式
    prompt = f"""
    你是一名专业的消费市场分析师。请结合用户提供的文本和图片（如果有），分析这篇社交媒体帖子的商业价值。
    
    用户文本内容：
    {request.text}
请分析并严格按照以下 JSON 格式返回结果，不要包含 Markdown 代码块（如 ```json ... ```），直接返回纯 JSON 字符串：
    {{
        "summary": "一句话总结核心观点",
        "sentiment_score": 8, 
        "sentiment_keywords": ["关键词1", "关键词2"],
        "user_persona": "推断的用户画像（如：价格敏感的学生党）",
        "pain_points": ["用户提到的痛点1", "痛点2"],
        "gain_points": ["用户提到的爽点1", "爽点2"],
        "marketing_suspicion": "高/中/低 (是否像广告)",
        "verdict": "买入/观望/劝退"
    }}
    注意：sentiment_score 范围是 0-10，10 为最积极。
    """

    # 构造 Qwen-VL 的消息格式
    # Qwen-VL 要求图片内容放在 message 的 content list 里
    content_list = []

    # 先放图片
    for url in request.image_urls:
        content_list.append({"image": url})

    # 再放 Prompt 文本
    content_list.append({"text": prompt})
    messages = [{"role": "user", "content": content_list}]

    try:
        # 调用阿里云 Qwen-VL
        response = dashscope.MultiModalConversation.call(
            model="qwen3-vl-flash",
            messages=messages,
        )

        if response.status_code == HTTPStatus.OK:
            # 提取回答
            raw_content = response.output.choices[0].message.content[0]["text"]
            print("Qwen Raw Output:", raw_content)

            # 清洗数据：有时候 LLM 还是会带 Markdown 标记，手动去掉
            clean_json = raw_content.replace("```json", "").replace("```", "").strip()

            # 解析为 JSON 对象
            result = json.loads(clean_json)
            return result
        else:
            error_msg = f"Model Error: {response.code} - {response.message}"
            print(error_msg)
            raise HTTPException(status_code=500, detail=error_msg)

    except json.JSONDecodeError:
        print("JSON 解析失败，模型返回了非 JSON 格式")
        raise HTTPException(status_code=500, detail="AI 分析结果格式错误")
    except Exception as e:
        print(f"System Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# 健康检查
@app.get("/")
def read_root():
    return {"status": "ok", "service": "Financial Agent Python Microservice"}
