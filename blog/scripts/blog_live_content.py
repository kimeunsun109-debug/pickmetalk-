"""글 생성 시 최신 정보 블록 (공모전 목록 등)"""

from __future__ import annotations

import json
import re
import ssl
import urllib.parse
import urllib.request
from datetime import date, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
LOGS = ROOT / "logs"
CACHE = LOGS / "live_contests_cache.json"
SEED = DATA / "contest_seed.json"

BOX = (
    "background:#F5F3F0; border-radius:10px; padding:20px 24px; margin:20px 0; "
    "font-family:'Nanum Gothic',나눔고딕,sans-serif; font-size:15pt; line-height:1.8; color:#2C2C2C;"
)
SUB = (
    "font-family:'Nanum Gothic',나눔고딕,sans-serif; font-size:18pt; font-weight:bold; "
    "color:#E8837A; border-left:4px solid #E8837A; padding-left:14px; "
    "margin:32px 0 14px; letter-spacing:0.5px;"
)
BODY = "font-family:'Nanum Gothic',나눔고딕,sans-serif; font-size:16pt; line-height:1.8; color:#2C2C2C;"


def _fetch_html(url: str, timeout: int = 20) -> str:
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept-Language": "ko-KR,ko;q=0.9",
        },
    )
    with urllib.request.urlopen(req, timeout=timeout, context=ctx) as r:
        return r.read().decode("utf-8", "replace")


def _parse_wevity(html: str) -> list[dict]:
    items: list[dict] = []
    blocks = re.findall(
        r'<div class="list[^"]*">.*?<p class="tit">.*?<a href="([^"]+)"[^>]*>([^<]+)</a>.*?'
        r'<p class="organ">([^<]*)</p>.*?<p class="day">([^<]*)</p>',
        html,
        re.S,
    )
    for href, title, org, day in blocks:
        title = re.sub(r"\s+", " ", title).strip()
        if not title or len(title) < 4:
            continue
        if not re.search(r"AI|인공지능|데이터|딥러닝|ChatGPT|생성형|LLM|스타트업", title + org, re.I):
            continue
        url = href if href.startswith("http") else f"https://www.wevity.com{href}"
        items.append(
            {
                "title": title,
                "org": org.strip(),
                "deadline": day.strip(),
                "url": url,
                "source": "wevity",
            }
        )
    return items


def _fmt_deadline(val) -> str:
    if val is None:
        return "마감일 공고 확인"
    if isinstance(val, (int, float)):
        try:
            ts = val / 1000 if val > 1e12 else val
            return datetime.fromtimestamp(ts).strftime("%Y-%m-%d")
        except Exception:
            return str(val)
    s = str(val).strip()
    if re.fullmatch(r"\d{13}", s):
        try:
            return datetime.fromtimestamp(int(s) / 1000).strftime("%Y-%m-%d")
        except Exception:
            pass
    return s or "마감일 공고 확인"


def _parse_linkareer(html: str) -> list[dict]:
    m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.S)
    if not m:
        return []
    try:
        data = json.loads(m.group(1))
    except Exception:
        return []

    items: list[dict] = []
    seen: set[str] = set()
    ai_pat = re.compile(r"AI|인공지능|데이터|ChatGPT|생성형|LLM|딥러닝|A\.I", re.I)

    def walk(obj) -> None:
        if isinstance(obj, dict):
            title = obj.get("title") or obj.get("name")
            oid = obj.get("id") or obj.get("activityId")
            dl = obj.get("recruitCloseAt") or obj.get("closeAt") or obj.get("deadline")
            if (
                isinstance(title, str)
                and len(title) >= 6
                and oid
                and dl
                and ai_pat.search(title)
                and title not in seen
            ):
                seen.add(title)
                org = ""
                for k in ("organizationName", "host", "companyName", "organizer"):
                    if obj.get(k):
                        org = str(obj[k])
                        break
                items.append(
                    {
                        "title": title.strip(),
                        "org": org,
                        "deadline": _fmt_deadline(dl),
                        "url": f"https://linkareer.com/activity/{oid}",
                        "source": "linkareer",
                    }
                )
            for v in obj.values():
                walk(v)
        elif isinstance(obj, list):
            for v in obj:
                walk(v)

    walk(data)
    return items


def _load_seed() -> list[dict]:
    if not SEED.exists():
        return []
    try:
        return list(json.loads(SEED.read_text(encoding="utf-8")).get("items", []))
    except Exception:
        return []


def _load_cache() -> list[dict]:
    if not CACHE.exists():
        return []
    try:
        data = json.loads(CACHE.read_text(encoding="utf-8"))
        if data.get("date") == date.today().isoformat():
            return list(data.get("items", []))
    except Exception:
        pass
    return []


def _save_cache(items: list[dict]) -> None:
    LOGS.mkdir(parents=True, exist_ok=True)
    CACHE.write_text(
        json.dumps({"date": date.today().isoformat(), "items": items}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def fetch_open_ai_contests(min_items: int = 5) -> list[dict]:
    cached = _load_cache()
    if len(cached) >= min_items:
        return cached

    items: list[dict] = []
    seen: set[str] = set()

    sources = [
        "https://linkareer.com/list/contest?isOpen=true&query=AI",
        "https://linkareer.com/list/contest?isOpen=true&query=%EC%9D%B8%EA%B3%B5%EC%A7%80%EB%8A%A5",
    ]
    for url in sources:
        try:
            html = _fetch_html(url)
            for it in _parse_linkareer(html):
                key = it["title"][:50]
                if key not in seen:
                    seen.add(key)
                    items.append(it)
        except Exception as e:
            print(f"[공모전] linkareer 수집 실패: {e}")

    keywords = ["인공지능", "AI"]
    for kw in keywords:
        try:
            q = urllib.parse.quote(kw)
            html = _fetch_html(
                f"https://www.wevity.com/?c=find&s=1&gub=1&cidx=20&gbn=viewok&sp=contents&keywords={q}"
            )
            for it in _parse_wevity(html):
                key = it["title"][:50]
                if key not in seen:
                    seen.add(key)
                    items.append(it)
        except Exception as e:
            print(f"[공모전] wevity({kw}) 수집 실패: {e}")

    if len(items) < min_items:
        for it in _load_seed():
            key = it.get("title", "")[:40]
            if key and key not in seen:
                seen.add(key)
                items.append(it)

    if items:
        _save_cache(items[:15])
    return items[:15]


def format_contests_section(items: list[dict]) -> str:
    today = date.today().isoformat()
    if not items:
        return f"""
<p style="{SUB}">📋 현재 응모 가능 AI 공모전 (수집 실패 — data/contest_seed.json 확인)</p>
<p style="{BODY}">공모전 목록을 자동 수집하지 못했습니다. 수동으로 wevity·공모전KON에서 「AI」 검색 후 이 섹션을 채워주세요.</p>
"""

    lines = [
        f'<p style="{SUB}">📋 지금 응모 가능한 AI 공모전 ({today} 기준)</p>',
        f'<p style="{BODY}">SuN이 <b>마감 전 공모전</b>만 골라봤어요. 세부 규정·일정은 반드시 공식 페이지에서 다시 확인하세요!</p>',
        f'<div style="{BOX}">',
    ]
    for i, it in enumerate(items, 1):
        title = it.get("title", "제목 없음")
        org = it.get("org", "")
        deadline = it.get("deadline", "마감일 공고 확인")
        url = it.get("url", "")
        org_bit = f" <span style='color:#8A8580;'>({org})</span>" if org else ""
        link = f'<a href="{url}" target="_blank" rel="noopener">{title}</a>' if url else title
        lines.append(f"<b>{i}. {link}</b>{org_bit}<br>📅 마감: {deadline}<br><br>")
    lines.append(
        "<span style='color:#8A8580; font-size:14pt;'>※ 상금·자격·제출방식은 링크에서 최종 확인!</span>"
    )
    lines.append("</div>")
    return "\n".join(lines)


def inject_dynamic_blocks(html: str, dynamic_blocks: list[str]) -> str:
    out = html
    if "ai_contests" in dynamic_blocks:
        section = format_contests_section(fetch_open_ai_contests())
        if "{dynamic_ai_contests}" in out:
            out = out.replace("{dynamic_ai_contests}", section)
        else:
            # 소개 직후 첫 이미지 앞에 삽입
            marker = '<p style="text-align:center; margin:24px 0;">'
            if marker in out:
                out = out.replace(marker, section + "\n\n" + marker, 1)
            else:
                out = section + out
    else:
        out = out.replace("{dynamic_ai_contests}", "")
    return out
