"""블로그용 이미지 — AI/스톡 사진 다운로드 (텍스트 전용 썸네일 금지)"""

from __future__ import annotations

import os
import random
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
load_dotenv = None
try:
    from dotenv import load_dotenv as _ld

    load_dotenv = _ld
    load_dotenv(ROOT / ".env")
except ImportError:
    pass

PEXELS_API_KEY = os.getenv("PEXELS_API_KEY", "").strip()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
IMAGE_PROVIDER = os.getenv("BLOG_IMAGE_PROVIDER", "pollinations").strip().lower()


def _download(url: str, path: Path, timeout: int = 120) -> bool:
    path.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) SuN-Blog/1.0"},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = resp.read()
        if len(data) < 8000:
            return False
        path.write_bytes(data)
        return True
    except Exception as e:
        print(f"[이미지] 다운로드 실패: {e}")
        return False


def _via_pollinations(prompt: str, path: Path, w: int = 1200, h: int = 675) -> bool:
    """무료 AI 이미지 생성 — 블로거가 직접 찍은 듯한 자연스러운 사진."""
    seed = random.randint(1, 999999)
    q = urllib.parse.quote(prompt)
    url = (
        f"https://image.pollinations.ai/prompt/{q}"
        f"?width={w}&height={h}&seed={seed}&nologo=true"
    )
    print(f"[이미지] AI 생성 중 (pollinations)...")
    return _download(url, path, timeout=180)


def _via_pexels(prompt: str, path: Path) -> bool:
    if not PEXELS_API_KEY:
        return False
    try:
        import json

        q = urllib.parse.quote(prompt.split(",")[0][:80])
        url = f"https://api.pexels.com/v1/search?query={q}&per_page=5&orientation=landscape"
        req = urllib.request.Request(url, headers={"Authorization": PEXELS_API_KEY})
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode())
        photos = data.get("photos") or []
        if not photos:
            return False
        photo = random.choice(photos[:3])
        src = photo.get("src", {}).get("large2x") or photo.get("src", {}).get("large")
        if not src:
            return False
        print(f"[이미지] Pexels 스톡 사진 다운로드...")
        return _download(src, path)
    except Exception as e:
        print(f"[이미지] Pexels 실패: {e}")
        return False


def _via_openai(prompt: str, path: Path) -> bool:
    if not OPENAI_API_KEY:
        return False
    try:
        import json

        body = json.dumps(
            {
                "model": "dall-e-3",
                "prompt": prompt[:1000],
                "n": 1,
                "size": "1792x1024",
                "response_format": "url",
            }
        ).encode("utf-8")
        req = urllib.request.Request(
            "https://api.openai.com/v1/images/generations",
            data=body,
            headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read().decode())
        img_url = data["data"][0]["url"]
        print("[이미지] OpenAI DALL-E 생성...")
        return _download(img_url, path)
    except Exception as e:
        print(f"[이미지] OpenAI 실패: {e}")
        return False


def _via_pil_illustration(prompt: str, path: Path) -> bool:
    """최후 수단 — 텍스트 대신 도형·그라데이션 일러스트 (글자 최소)."""
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        return False

    w, h = 1200, 675
    img = Image.new("RGB", (w, h), "#FAFAF8")
    draw = ImageDraw.Draw(img)
    # 그라데이션 느낌 밴드
    for i in range(h):
        c = 250 - int(30 * i / h)
        draw.line([(0, i), (w, i)], fill=(c, c - 2, c - 4))
    # 중앙 오브젝트 (로봇/기기 실루엣)
    cx, cy = w // 2, h // 2 + 20
    draw.ellipse([cx - 180, cy - 80, cx + 180, cy + 80], fill="#E8837A", outline="#2C2C2C", width=3)
    draw.ellipse([cx - 40, cy - 120, cx + 40, cy - 40], fill="#8A8580")
    draw.rectangle([cx - 220, cy + 60, cx + 220, cy + 100], fill="#2C2C2C")
    # 장식 원 — 텍스트 없음
    for x, y, r, col in [(120, 120, 40, "#E8E4DF"), (w - 150, 180, 55, "#F5F3F0"), (200, h - 100, 30, "#E8837A")]:
        draw.ellipse([x - r, y - r, x + r, y + r], fill=col)
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "PNG")
    print(f"[이미지] 일러스트 폴백 저장: {path.name}")
    return True


def create_blog_image(
    prompt: str,
    path: Path,
    *,
    style: str = "photo",
    shot: str = "lifestyle",
) -> bool:
    """
    prompt: 영문 권장 (주제 묘사)
    style: photo | illustration | flat
    shot: hero | use | detail | compare | lifestyle | closing
    """
    try:
        from blog_post_quality import enhance_image_prompt

        full_prompt = enhance_image_prompt(prompt, shot)
    except ImportError:
        full_prompt = (
            f"{prompt}, casual smartphone lifestyle photo, natural light, "
            "realistic shadows, muted colors, no HDR, no text, no watermark"
        )
    if style == "illustration":
        full_prompt = f"{prompt}, soft flat illustration, warm pastel tones, no text, no watermark"
    providers = []
    if IMAGE_PROVIDER == "pexels":
        providers = [_via_pexels, _via_pollinations]
    elif IMAGE_PROVIDER == "openai":
        providers = [_via_openai, _via_pollinations]
    else:
        providers = [_via_pollinations, _via_pexels]

    for fn in providers:
        if fn(full_prompt, path):
            print(f"[이미지] 완료: {path.name}")
            return True
        time.sleep(1)

    return _via_pil_illustration(full_prompt, path)
