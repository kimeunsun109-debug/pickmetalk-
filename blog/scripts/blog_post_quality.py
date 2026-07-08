"""네이버 블로그 상위 수준 품질 검증·이미지 프롬프트 보강"""

from __future__ import annotations

import re

MIN_CHARS = 2000
TARGET_CHARS = 2500
MIN_IMAGES = 4
MAX_IMAGES = 8
MIN_SUBHEADINGS = 4

HUMAN_VOICE_PATTERNS = [
    r"해봤",
    r"써\s*봤",
    r"느꼈",
    r"생각보다",
    r"처음에는",
    r"직접\s*사용",
    r"의외",
    r"솔직",
    r"체감",
    r"저도",
    r"우리\s*집",
]

NATURAL_PHOTO_SUFFIX = (
    "casual smartphone photo for lifestyle blog, natural window light, "
    "realistic indoor shadows, slightly off-center composition, "
    "authentic lived-in home, muted natural colors, soft focus background, "
    "subtle sensor grain, not HDR, not oversaturated, not CGI, not stock photo, "
    "no plastic skin texture, no perfect symmetry, small everyday clutter, "
    "no text, no watermark, no logo"
)

SHOT_ENHANCERS = {
    "hero": "wide establishing shot, blogger home tour vibe",
    "use": "hands using device in real daily scene, over-shoulder angle",
    "detail": "close-up detail shot, shallow depth of field, macro lifestyle",
    "compare": "side by side comparison on table, natural desk lighting",
    "lifestyle": "candid moment in living room, relaxed atmosphere",
    "closing": "warm cozy ending mood, evening ambient light at home",
}


def enhance_image_prompt(prompt: str, shot: str = "lifestyle") -> str:
    extra = SHOT_ENHANCERS.get(shot, SHOT_ENHANCERS["lifestyle"])
    base = prompt.strip().rstrip(",.")
    return f"{base}, {extra}, {NATURAL_PHOTO_SUFFIX}"


def _strip_html(html: str) -> str:
    text = re.sub(r"<[^>]+>", " ", html)
    return re.sub(r"\s+", " ", text).strip()


def count_images(html: str) -> int:
    return len(re.findall(r"<img\s", html, re.I))


def count_subheadings(html: str) -> int:
    return len(re.findall(r'font-size:18pt;\s*font-weight:bold', html))


def validate_quality(html: str, *, min_chars: int = MIN_CHARS, min_images: int = MIN_IMAGES) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []
    plain = _strip_html(html)
    char_count = len(plain)

    if char_count < min_chars:
        errors.append(f"본문 분량 부족 (현재 {char_count}자, 최소 {min_chars}자)")
    elif char_count < TARGET_CHARS:
        warnings.append(f"분량 권장 미달 (현재 {char_count}자, 권장 {TARGET_CHARS}자+)")

    img_count = count_images(html)
    if img_count < min_images:
        errors.append(f"이미지 부족 (현재 {img_count}장, 최소 {min_images}장)")

    sub_count = count_subheadings(html)
    if sub_count < MIN_SUBHEADINGS:
        errors.append(f"소제목 부족 (현재 {sub_count}개, 최소 {MIN_SUBHEADINGS}개)")

    human_hits = sum(1 for p in HUMAN_VOICE_PATTERNS if re.search(p, plain))
    if human_hits < 2:
        errors.append("사람이 쓴 느낌의 표현 부족 (경험·체감 문장 2개 이상 필요)")

    if not re.search(r"장점|단점|주의|팁|FAQ|자주\s*묻", plain):
        errors.append("장점/단점·주의사항·팁 중 하나 이상 필요")

    return errors, warnings


def validate_quality_strict(html: str, **kwargs) -> list[str]:
    """하위 호환 — errors만 반환."""
    errors, _ = validate_quality(html, **kwargs)
    return errors
