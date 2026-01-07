



uvicorn main:app --reload --port 8089

curl -X POST http://localhost:8089/api/vibe/pydanticai/sentiment \
-H "Content-Type: application/json" \
-d '{
    "text": "告诉我这图中的内容",
    "image_urls": ["https://i2.hdslb.com/bfs/archive/a921f8ef1b7c66698f4a6fbe0c6cbd6d33cdb815.jpg@672w_378h_1c_!web-home-common-cover.avif"]
}'

curl -X POST http://localhost:8089/api/vibe/pydanticai/sentiment \
-H "Content-Type: application/json" \
-d '{
    "text": "告诉我这图中的内容",
    "image_urls": ["blob:https://gemini.google.com/64a178ae-03a2-4d9e-b616-138618cd2d70"]
}'