"""아이디어 문장에서 글에 꼭 넣어야 할 요구사항 추출·검증"""

from __future__ import annotations

import re
from dataclasses import dataclass, field


@dataclass
class IdeaRequirements:
    post_type: str = "general"
    must_sections: list[str] = field(default_factory=list)
    must_keywords: list[str] = field(default_factory=list)
    dynamic_blocks: list[str] = field(default_factory=list)
    min_list_items: int = 0
    require_pros: bool = False
    require_cons: bool = False
    require_howto: bool = False
    require_solution_steps: bool = False
    hints: list[str] = field(default_factory=list)


def parse_idea_title(raw: str) -> tuple[str, list[str]]:
    """괄호 안 힌트(장점/단점 등) 분리."""
    hints = re.findall(r"\(([^)]+)\)", raw)
    title = re.sub(r"\s*\([^)]*\)", "", raw).strip()
    return title, hints


def infer_requirements(raw_title: str) -> IdeaRequirements:
    title, hints = parse_idea_title(raw_title)
    t = title.lower()
    req = IdeaRequirements(hints=hints)

    if re.search(r"공모전|챌린지|해커톤", title) and re.search(
        r"뭐가|있지|정리|목록|응모\s*할", title
    ):
        req.post_type = "current_list"
        req.must_sections = ["현재 응모 가능", "공모전 목록"]
        req.must_keywords = ["마감"]
        req.dynamic_blocks = ["ai_contests"]
        req.min_list_items = 5

    elif re.search(r"후기|써\s*봤|사용해\s*보", title):
        req.post_type = "review"
        req.must_sections = ["장점", "단점"]
        req.require_pros = True
        req.require_cons = True

    elif re.search(r"vpn", t, re.I) or "활용법" in title:
        req.post_type = "howto"
        req.must_sections = ["뭐지", "왜", "활용"]
        req.require_howto = True
        if "왜" in title:
            req.must_keywords.append("이유")

    elif re.search(r"해결|방법|어떻게", title):
        req.post_type = "problem_solution"
        req.must_sections = ["해결", "방법"]
        req.require_solution_steps = True
        req.min_list_items = 3

    elif re.search(r"왜|이유", title):
        req.post_type = "explainer"
        req.must_sections = ["이유", "정리"]
        req.must_keywords.append("왜")

    elif re.search(r"장단점|장점|단점", title):
        req.post_type = "pros_cons"
        req.require_pros = True
        req.require_cons = True
        req.must_sections = ["장점", "단점"]

    for hint in hints:
        if re.search(r"장점", hint):
            req.require_pros = True
            if "장점" not in req.must_sections:
                req.must_sections.append("장점")
        if re.search(r"단점", hint):
            req.require_cons = True
            if "단점" not in req.must_sections:
                req.must_sections.append("단점")
        req.hints.append(hint)

    return req


def merge_requirements(base: IdeaRequirements, extra: dict | None) -> IdeaRequirements:
    if not extra:
        return base
    if extra.get("post_type"):
        base.post_type = extra["post_type"]
    for key in ("must_sections", "must_keywords", "dynamic_blocks", "hints"):
        base_vals = getattr(base, key)
        for v in extra.get(key, []):
            if v not in base_vals:
                base_vals.append(v)
    if extra.get("min_list_items"):
        base.min_list_items = max(base.min_list_items, int(extra["min_list_items"]))
    for flag in ("require_pros", "require_cons", "require_howto", "require_solution_steps"):
        if extra.get(flag):
            setattr(base, flag, True)
    return base


def _strip_html(html: str) -> str:
    text = re.sub(r"<[^>]+>", " ", html)
    return re.sub(r"\s+", " ", text)


def validate_post_html(html: str, req: IdeaRequirements, idea_title: str) -> list[str]:
    """누락 시 오류 메시지 목록 반환. 비어 있으면 통과."""
    errors: list[str] = []
    plain = _strip_html(html)

    for kw in req.must_keywords:
        if kw in plain:
            continue
        if kw == "이유" and re.search(r"왜|이유", plain):
            continue
        errors.append(f"필수 키워드 누락: 「{kw}」")

    if req.require_pros and not re.search(r"장점|👍|좋았", plain):
        errors.append("장점/좋은 점 섹션 누락")
    if req.require_cons and not re.search(r"단점|👎|아쉬", plain):
        errors.append("단점/아쉬운 점 섹션 누락")
    if req.require_howto and not re.search(r"활용|사용법|이렇게", plain):
        errors.append("활용법/사용법 섹션 누락")
    if req.require_solution_steps and not re.search(r"해결|방법|Step|단계", plain):
        errors.append("해결방법/단계별 안내 누락")

    if req.post_type == "current_list":
        # 공모전명 + 마감 패턴 (동적 블록 마커 또는 리스트 항목)
        named = len(re.findall(r"<b>[^<]{4,}</b>", html))
        deadline = len(re.findall(r"마감|D-\d+|~\d{4}", plain))
        if named < req.min_list_items:
            errors.append(
                f"현재 응모 가능 공모전 목록 부족 (최소 {req.min_list_items}건, 현재 {named}건)"
            )
        if deadline < min(3, req.min_list_items):
            errors.append("공모전별 마감일 정보 누락")

    for hint in req.hints:
        # 장점/단점 힌트의 핵심 단어가 본문에 반영됐는지
        for token in re.findall(r"[가-힣A-Za-z0-9]{3,}", hint):
            if token in ("장점", "단점", "기능"):
                continue
            if token.lower() in plain.lower():
                break
        else:
            if len(hint) > 8:
                errors.append(f"아이디어 힌트 미반영: ({hint[:40]}…)")

    if errors:
        errors.insert(0, f"아이디어: {idea_title}")
    return errors
