from fastapi import FastAPI
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

from vibe.sentiment import router as vibe_sentiment_router  # noqa: E402
from vibe.pydanticai_demo import router as vibe_pydanticai_router  # noqa: E402

app.include_router(vibe_sentiment_router)
app.include_router(vibe_pydanticai_router)


@app.get("/")
def read_root():
    return {"status": "ok", "service": "Financial Agent Python Microservice"}
