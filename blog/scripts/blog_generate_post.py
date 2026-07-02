#!/usr/bin/env python3
"""오늘 올릴 블로그 글 + 이미지 생성 (posts/, images/)"""

from __future__ import annotations

import json
import re
import sys
import time
from datetime import date
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
POSTS = ROOT / "posts"
IMAGES = ROOT / "images"
LOGS = ROOT / "logs"
IDEAS = DATA / "블로그글 아이디어.txt"
USED = DATA / "used_ideas.json"

from blog_image import create_blog_image

BODY = "font-family:'Nanum Gothic',나눔고딕,sans-serif; font-size:16pt; line-height:1.8; color:#2C2C2C;"
SUB = (
    "font-family:'Nanum Gothic',나눔고딕,sans-serif; font-size:18pt; font-weight:bold; "
    "color:#E8837A; border-left:4px solid #E8837A; padding-left:14px; "
    "margin:32px 0 14px; letter-spacing:0.5px;"
)
TAGS = (
    "font-family:'Nanum Gothic',나눔고딕,sans-serif; font-size:14pt; "
    "line-height:2; color:#8A8580; margin-top:32px;"
)
BOX = (
    "background:#F5F3F0; border-radius:10px; padding:20px 24px; margin:20px 0; "
    "font-family:'Nanum Gothic',나눔고딕,sans-serif; font-size:15pt; line-height:1.8; color:#2C2C2C;"
)

POSTS_DB: dict[int, dict] = {
    3: {
        "title": "로봇청소기 퇴근 노래 커스텀하는 법 — 브랜드별 설정 총정리",
        "slug": "로봇청소기_퇴근노래_커스텀",
        "images": [
            {
                "file": "blog_robot_01_dock_music.png",
                "alt": "로봇청소기 도킹 음악",
                "prompt": "robot vacuum cleaner returning to white docking station in modern minimalist living room, warm natural light, realistic product photo",
                "style": "photo",
            },
            {
                "file": "blog_robot_02_app_custom.png",
                "alt": "앱 커스텀 설정",
                "prompt": "smartphone showing smart home app controlling robot vacuum, close-up hands, clean UI screen, IoT lifestyle",
                "style": "photo",
            },
            {
                "file": "blog_robot_03_happy_home.png",
                "alt": "로봇청소기 라이프스타일",
                "prompt": "cozy bright living room with robot vacuum on wooden floor, plants and sofa, lifestyle photography, happy home",
                "style": "photo",
            },
        ],
        "tags": "#로봇청소기 #스마트홈 #IoT #삼성 #샤오미 #로보락 #가전덕후 #SuN #홈자동화 #취미",
        "html": """
<p style="{body}">
안녕하세요~가전덕후 SuN 입니다 😊<br><br>
청소 끝나고 도킹 스테이션으로 돌아오는 로봇청소기… 거기에 <b>「퇴근합니다~」</b> 같은 멘트나 노래가 나오면 진짜 귀엽거든요 ㅋㅋ<br>
오늘은 <b>로봇청소기 퇴근 노래·멘트 커스텀</b> 하는 방법, 브랜드별로 쏙쏙 정리해볼게요!
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_robot_01_dock_music.png" alt="로봇청소기 도킹 음악" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">🎵 왜 퇴근 노래 커스텀이 유행할까?</p>
<p style="{body}">
스마트홈이 일상화되면서 로봇청소기도 그냥 가전이 아니라 <b>집안 캐릭터</b>처럼 느껴지는 경우 많아요.<br>
기본 알림음은 똑같고 밋밋한데, 커스텀하면<br>
✅ 귀여움 UP (가족 반응 좋음)<br>
✅ 청소 끝났다는 걸 귀로 바로 인지<br>
✅ SNS·블로그 콘텐츠로도 재밌음<br><br>
저도 처음엔 「뭐야 이거」 했는데… 일주일 지나니 없으면 허전해졌습니다 😅
</p>

<p style="{sub}">⚙️ 브랜드별 커스텀 가능 범위</p>
<div style="{box}">
<b style="color:#E8837A;">삼성 Jet Bot / Bespoke AI</b><br>
• 앱 내 음성·알림 설정 (모델·펌웨어에 따라 다름)<br>
• 일부 모델: 청소 완료 멘트 변경 가능<br><br>
<b style="color:#E8837A;">샤오미 / 드리미</b><br>
• Mi Home 앱 → 기기 설정 → 알림음/음성<br>
• 완료 알림 ON/OFF, 일부 커스텀 음원<br><br>
<b style="color:#E8837A;">로보락</b><br>
• Roborock 앱 → 설정 → 음성 패키지<br>
• 다국어 음성팩 + 완료 알림 커스텀 (모델별 상이)<br><br>
<b style="color:#8A8580;">공통 팁</b><br>
• 펌웨어 최신 버전 먼저!<br>
• 앱 권한(알림·마이크) 허용 확인<br>
• 커스텀 음원은 저작권·용량 제한 체크
</div>

<p style="text-align:center; margin:24px 0;">
<img src="blog_robot_02_app_custom.png" alt="앱 커스텀 설정" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">🛠️ SuN이 추천하는 커스텀 아이디어 5가지</p>
<p style="{body}">
1️⃣ <b>「퇴근합니다~」</b> — 직장인 공감 200%<br>
2️⃣ <b>짧은 징글 3초</b> — 가족이 안 짜증 나는 길이<br>
3️⃣ <b>아이 이름 불러주기</b> — 「민수야 청소 끝!」<br>
4️⃣ <b>요일별 다른 멘트</b> — 금요일만 「불금 청소 완료!」<br>
5️⃣ <b>조용 모드</b> — 밤 10시 이후는 무음 (이웃·가족 배려)<br><br>
너무 길거나 시끄러우면 오히려 스트레스니까 <b>3~5초 컷</b> 추천해요 ㅋㅋ
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_robot_03_happy_home.png" alt="로봇청소기 라이프스타일" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">💡 SuN의 솔직 한줄평</p>
<p style="{body}">
퇴근 노래 커스텀은 <b>기능보다 재미</b>에 가깝지만, 스마트홈 만족도는 확 올라가요.<br>
다만 모델마다 지원 범위가 달라서 — 사기 전에 「완료 음성 커스텀 되나요?」 한번 검색해보세요!<br><br>
여러분 로봇청소기 퇴근 멘트 뭐로 해두셨어요? 댓글로 알려주세요~ 🎵👋
</p>

<p style="{tags}">{tagline}</p>
""",
    },
    4: {
        "title": "스마트도어락 장단점 총정리 — 비밀번호·지문·얼굴인식 뭐가 나을까?",
        "slug": "스마트도어락_장단점",
        "images": [
            {
                "file": "blog_doorlock_01_smart.png",
                "alt": "스마트도어락",
                "prompt": "modern smart door lock on apartment entrance door, sleek black digital keypad, realistic product photo",
                "style": "photo",
            },
            {
                "file": "blog_doorlock_02_types.png",
                "alt": "인증 방식 비교",
                "prompt": "smart door lock fingerprint scanner and keypad close-up, security technology, product detail shot",
                "style": "photo",
            },
            {
                "file": "blog_doorlock_03_home.png",
                "alt": "현관 스마트홈",
                "prompt": "modern home entrance hallway with smart lock and warm lighting, interior design photography",
                "style": "photo",
            },
        ],
        "tags": "#스마트도어락 #도어락 #스마트홈 #IoT #보안 #가전덕후 #SuN #현관 #홈자동화",
        "html": """
<p style="{body}">
안녕하세요~오늘의 핫한 IT이야기를 알려드리러 온 SuN 입니다 🔥<br><br>
열쇠 찾다가 문 앞에서 서 있는 기분… 다들 아시죠? 😅<br>
오늘은 <b>스마트도어락</b> 도입 전 꼭 알아야 할 장단점을 SuN 기준으로 정리해볼게요!
</p>
<p style="text-align:center; margin:24px 0;">
<img src="blog_doorlock_01_smart.png" alt="스마트도어락" style="max-width:100%; border-radius:12px;" />
</p>
<p style="{sub}">🔐 스마트도어락, 뭐가 다른데?</p>
<p style="{body}">
비밀번호·지문·카드키·스마트폰·얼굴인식까지 — 인증 방식이 다양해졌어요.<br>
IoT 연동되면 출근할 때 원격으로 문 열어주기, 방문 기록 확인도 가능합니다.
</p>
<div style="{box}">
<b style="color:#E8837A;">👍 장점</b><br>
• 열쇠 분실 걱정 ↓<br>
• 출입 기록 확인<br>
• 가족·Airbnb 임시 비번 발급<br><br>
<b style="color:#8A8580;">👎 단점</b><br>
• 배터리 교체 필요 (방전 주의!)<br>
• 초기 비용·설치비<br>
• 해킹·오작동 이슈 (드물지만 존재)
</div>
<p style="{sub}">💡 SuN의 솔직 한줄평</p>
<p style="{body}">
1인 가구·맞벌이면 체감 편의가 큽니다. 다만 <b>배터리 알림</b>은 꼭 켜두세요 — 진짜 중요해요!<br>
댓글로 쓰시는 브랜드 알려주시면 다음에 비교글도 써볼게요~
</p>
<p style="{tags}">{tagline}</p>
""",
    },
}


def load_used() -> set[int]:
    if not USED.exists():
        return {1, 2}  # 이미 작성한 아이디어
    try:
        data = json.loads(USED.read_text(encoding="utf-8"))
        return set(int(x) for x in data.get("used", []))
    except Exception:
        return {1, 2}


def save_used(used: set[int]) -> None:
    USED.write_text(
        json.dumps({"used": sorted(used), "updated": date.today().isoformat()}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def parse_ideas_file() -> list[tuple[int, str]]:
    if not IDEAS.exists():
        return []
    out: list[tuple[int, str]] = []
    for line in IDEAS.read_text(encoding="utf-8").splitlines():
        m = re.match(r"^\s*(\d+)\.\s*(.+)", line.strip())
        if m:
            out.append((int(m.group(1)), m.group(2).strip()))
    return out


def pick_idea_id() -> int:
    used = load_used()
    for iid, _ in parse_ideas_file():
        if iid not in used and iid in POSTS_DB:
            return iid
    for iid in sorted(POSTS_DB):
        if iid not in used:
            return iid
    return 3


def make_images_for_spec(spec: dict) -> list[str]:
    img_names: list[str] = []
    for item in spec["images"]:
        if isinstance(item, dict):
            fname = item["file"]
            prompt = item.get("prompt", item.get("alt", spec["title"]))
            style = item.get("style", "photo")
        else:
            fname, alt = item[0], item[1] if len(item) > 1 else spec["title"]
            prompt = alt
            style = "photo"
        path = IMAGES / fname
        ok = create_blog_image(prompt, path, style=style)
        if not ok:
            print(f"[이미지] 경고: {fname} 생성 실패")
        img_names.append(fname)
        time.sleep(2)
    return img_names


def render_post(idea_id: int) -> tuple[Path, list[str]]:
    spec = POSTS_DB[idea_id]
    today = date.today().isoformat()
    out_html = POSTS / f"{today}_{idea_id:02d}_{spec['slug']}_임시저장용.html"
    img_names = make_images_for_spec(spec)

    body_html = spec["html"].format(
        body=BODY,
        sub=SUB,
        box=BOX,
        tags=TAGS,
        tagline=spec["tags"],
    )
    full = f"""<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<title>{spec['title']}</title>
</head>
<body>
{body_html}
</body>
</html>
"""
    out_html.write_text(full, encoding="utf-8")
    print(f"[글] {out_html}")
    return out_html, img_names


def main() -> int:
    import argparse

    ap = argparse.ArgumentParser()
    ap.add_argument("--regen-images", type=int, default=0, help="아이디어 번호 이미지만 재생성")
    args = ap.parse_args()

    IMAGES.mkdir(parents=True, exist_ok=True)
    POSTS.mkdir(parents=True, exist_ok=True)

    if args.regen_images:
        iid = args.regen_images
        if iid not in POSTS_DB:
            print(f"아이디어 {iid} 없음")
            return 1
        imgs = make_images_for_spec(POSTS_DB[iid])
        meta = LOGS / "latest_post.json"
        if meta.exists():
            try:
                data = json.loads(meta.read_text(encoding="utf-8"))
                data["images"] = imgs
                meta.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
            except Exception:
                pass
        print(f"[완료] 이미지 {len(imgs)}장 재생성")
        return 0

    today = date.today().isoformat()
    meta = LOGS / "latest_post.json"
    if meta.exists():
        try:
            data = json.loads(meta.read_text(encoding="utf-8"))
            if data.get("date") == today:
                html = Path(data.get("html", ""))
                if html.exists():
                    print(f"[글] 오늘 글 이미 있음 — 스킵: {html.name}")
                    return 0
        except Exception:
            pass
    today_posts = sorted(POSTS.glob(f"{today}_*_임시저장용.html"))
    if today_posts:
        print(f"[글] 오늘 글 이미 있음 — 스킵: {today_posts[-1].name}")
        return 0

    idea_id = pick_idea_id()
    html_path, images = render_post(idea_id)
    used = load_used()
    used.add(idea_id)
    save_used(used)
    meta = ROOT / "logs" / "latest_post.json"
    meta.parent.mkdir(parents=True, exist_ok=True)
    meta.write_text(
        json.dumps(
            {
                "date": date.today().isoformat(),
                "idea_id": idea_id,
                "html": str(html_path),
                "images": images,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
