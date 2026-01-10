import base64  # 提供标准的 Base64 编解码
import mimetypes  # 根据文件名/后缀推断 MIME 类型
from pathlib import Path  # 更安全的跨平台路径操作
from typing import Tuple  # 类型注解：返回 (bytes, str)

import requests  # 轻量 HTTP 客户端，用于下载图片

# 统一的图片辅助函数：负责从本地或网络加载图片，并完成 Base64 编解码等工作


def _guess_media_type(name: str, fallback: str = "image/jpeg") -> str:
    media_type, _ = mimetypes.guess_type(name)  # 尝试根据文件名/扩展名推断 MIME（如 image/png）
    return media_type or fallback  # 若无法判断则退回默认值，保证后续逻辑可用


def load_image_from_source(source: str) -> Tuple[bytes, str]:
    """
    支持 http(s) URL 和本地路径，返回 (二进制数据, media_type)。
    """
    # 如果是 URL，走网络下载分支
    if source.startswith("http://") or source.startswith("https://"):
        resp = requests.get(source, timeout=15)  # 设置超时，避免挂起
        resp.raise_for_status()  # 非 2xx 主动抛错，便于上层处理
        content_type = resp.headers.get("Content-Type", "")  # 读取服务器返回的 MIME
        media_type = content_type.split(";")[0].strip() if content_type else _guess_media_type(source)
        return resp.content, media_type or "image/jpeg"  # 兜底 MIME，避免 None

    # 否则认为是本地路径：先展开 ~，再转为绝对路径
    path = Path(source).expanduser().resolve()
    if not path.is_file():  # 路径不存在或不是文件时直接失败
        raise FileNotFoundError(f"找不到文件: {path}")
    data = path.read_bytes()  # 直接读取二进制
    media_type = _guess_media_type(path.name)  # 基于文件名推断 MIME
    return data, media_type


def decode_base64_image(data: str, default_media_type: str = "image/jpeg") -> Tuple[bytes, str]:
    """
    支持 data URI（data:image/png;base64,...）或纯 base64 字符串。
    """
    # data URI 形式（内联包含 MIME 信息），形如 data:image/png;base64,xxxx
    if data.startswith("data:"):
        header, b64_data = data.split(",", 1)  # 仅切一次，防止正文里有逗号
        media_type = header.split(";")[0].replace("data:", "") or default_media_type
        raw = base64.b64decode(b64_data)  # 解码得到原始二进制
        return raw, media_type
    # 否则认为是纯 base64 字符串，使用默认 MIME
    raw = base64.b64decode(data)
    return raw, default_media_type


def to_base64(data: bytes) -> str:
    return base64.b64encode(data).decode("utf-8")  # 将二进制编码为可传输的字符串（常用于 JSON）
