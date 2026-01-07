
uv init
uv python pin 3.13
uv sync
uv pip compile pyproject.toml -o requirements.txt

source .venv/bin/activate


uvicorn main:app --reload --port 8089
