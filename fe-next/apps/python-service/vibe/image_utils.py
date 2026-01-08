import base64
import mimetypes
from pathlib import Path
from typing import Tuple

import requests


def _guess_media_type(name: str, fallback: str = "image/jpeg") -> str:
    media_type, _ = mimetypes.guess_type(name)
    return media_type or fallback


def load_image_from_source(source: str) -> Tuple[bytes, str]:
    """
    支持 http(s) URL 和本地路径，返回 (二进制数据, media_type)。
    """
    if source.startswith("http://") or source.startswith("https://"):
        resp = requests.get(source, timeout=15)
        resp.raise_for_status()
        content_type = resp.headers.get("Content-Type", "")
        media_type = content_type.split(";")[0].strip() if content_type else _guess_media_type(source)
        return resp.content, media_type or "image/jpeg"

    path = Path(source).expanduser().resolve()
    if not path.is_file():
        raise FileNotFoundError(f"找不到文件: {path}")
    data = path.read_bytes()
    media_type = _guess_media_type(path.name)
    return data, media_type


def decode_base64_image(data: str, default_media_type: str = "image/jpeg") -> Tuple[bytes, str]:
    """
    支持 data URI（data:image/png;base64,...）或纯 base64 字符串。
    """
    if data.startswith("data:"):
        header, b64_data = data.split(",", 1)
        media_type = header.split(";")[0].replace("data:", "") or default_media_type
        raw = base64.b64decode(b64_data)
        return raw, media_type
    raw = base64.b64decode(data)
    return raw, default_media_type


def to_base64(data: bytes) -> str:
    return base64.b64encode(data).decode("utf-8")
