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
IDEAS_MD = ROOT / "블로그글 아이디어.md"
IDEAS_TXT = DATA / "블로그글 아이디어.txt"
USED = DATA / "used_ideas.json"

from blog_image import create_blog_image
from blog_idea_requirements import (
    infer_requirements,
    merge_requirements,
    parse_idea_title,
    validate_post_html,
)
from blog_post_quality import validate_quality
from blog_live_content import inject_dynamic_blocks
from blog_posts_templates_1_4 import POSTS_DB_1_4
from blog_posts_templates_7_14 import POSTS_DB_7_14

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
    5: {
        "title": "미래 가전에 AI 추론 기능이 들어가면 뭐가 달라질까? — CES 2026부터 집에서 체감까지",
        "slug": "미래가전_AI추론_변화",
        "images": [
            {
                "file": "blog_ai_inference_01_home.png",
                "alt": "스마트홈 거실",
                "prompt": "Korean apartment living room with smart TV air purifier and robot vacuum, evening window light",
                "shot": "hero",
            },
            {
                "file": "blog_ai_inference_02_fridge.png",
                "alt": "냉장고 내부",
                "prompt": "open refrigerator with vegetables and leftovers, person checking food casually, kitchen counter",
                "shot": "use",
            },
            {
                "file": "blog_ai_inference_03_ac.png",
                "alt": "에어컨 자동 조절",
                "prompt": "wall mounted air conditioner in bedroom, person sleeping under blanket, soft morning light",
                "shot": "lifestyle",
            },
            {
                "file": "blog_ai_inference_04_robot.png",
                "alt": "로봇청소기",
                "prompt": "robot vacuum cleaning hardwood floor near sofa, pet hair visible, realistic home scene",
                "shot": "detail",
            },
            {
                "file": "blog_ai_inference_05_chip.png",
                "alt": "온디바이스 AI",
                "prompt": "close-up of smart appliance internal chip board on table, tech blogger hands, desk lamp",
                "shot": "detail",
            },
            {
                "file": "blog_ai_inference_06_compare.png",
                "alt": "클라우드 vs 온디바이스",
                "prompt": "two smartphones side by side on coffee table comparing cloud vs local processing diagram sketch on paper",
                "shot": "compare",
            },
        ],
        "tags": "#AI추론 #스마트가전 #온디바이스AI #CES2026 #스마트홈 #가전덕후 #SuN #삼성전자 #LG전자 #생활가전",
        "must_include": {"must_keywords": ["왜"], "min_list_items": 3},
        "html": """
<p style="{body}">
안녕하세요~가전덕후 SuN 입니다 😊<br><br>
요즘 뉴스만 틀어도 AI 얘기가 나오는데, 솔직히 「앱 안에서만 도는 AI」랑 「가전 안에 박힌 AI」는 체감이 완전 달라요.<br>
저도 처음에는 「그냥 음성인식 업그레이드 아닌가?」 싶었는데, CES 2026 쪽 자료랑 실제 스마트홈 써보면서 생각이 바뀌었거든요.<br>
오늘은 <b>미래 가전에 AI 추론 기능이 들어가면 뭐가 달라지는지</b> — 개념부터 장단점, 브랜드별 흐름, 집에서 준비할 것까지 길~게 정리해볼게요!
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_ai_inference_01_home.png" alt="스마트홈 거실" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">🤖 AI 추론 기능이란? — 「예약」과 「판단」의 차이</p>
<p style="{body}">
많이들 헷갈리시는데, <b>AI 추론</b>은 단순히 「밤 10시에 에어컨 켜」 같은 <b>시간 예약</b>이 아니에요.<br><br>
가전이 센서·사용 기록·외부 정보를 <b>동시에 읽고</b>, 그다음에 뭘 할지 <b>스스로 결정</b>하는 거죠.<br>
예를 들어 냉장고가 「오늘 저녁에 닭가슴살 꺼내라」고 알려주려면 — 남은 재료, 유통기한, 가족 식사 패턴, 내일 일정까지 엮어서 판단해야 하잖아요. 이게 추론이에요.<br><br>
<b>클라우드 AI</b>는 데이터를 서버로 보내 처리하고, <b>온디바이스 AI</b>는 가전 안 칩에서 바로 처리합니다.<br>
SuN이 직접 써보면서 느낀 건 — 응답 속도·프라이버시·인터넷 끊김 대응에서 온디바이스 쪽이 체감이 훨씬 낫다는 점이었어요. 다만 초기 제품은 가격이 올라가는 건 피할 수 없더라고요 ㅎㅎ
</p>

<p style="{sub}">📺 CES 2026 — 가전 업계가 말하는 방향</p>
<p style="{body}">
올해 CES 쪽 키워드를 훑어보면 「On-Device AI」「Agentic Home」「Energy Aware」 같은 말이 반복돼요.<br>
삼성·LG 같은 메이저는 이미 <b>가전 OS + AI 허브</b> 구조를 밀고 있고, 「집안 기기들이 서로 상황을 공유해서 행동한다」는 그림을 그리고 있죠.<br><br>
<b>삼성</b> 쪽은 Bixby·SmartThings 축으로 「집 전체 에이전트」 느낌이 강하고,<br>
<b>LG</b>는 ThinQ·UP 가전 라인에서 「생활 데이터 누적 → 맞춤 추천」 쪽을 강조하는 편이에요.<br><br>
저는 전시 영상만 볼 때보다, 실제 우리 집 평수·가족 구성·인터넷 환경을 대입해 보면 「와~」보다 「음, 우리 집에선 이 기능이 쓸까?」가 먼저 나와요. 이 부분이 의외로 중요합니다!
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_ai_inference_02_fridge.png" alt="냉장고" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">✨ 왜 중요할까? — 생활이 바뀌는 5가지 지점</p>
<div style="{box}">
<b style="color:#E8837A;">1) 냉장고 · 식재료 관리</b><br>
남은 재료 + 유통기한 + 소비 속도를 보고 「이번 주 먼저 먹을 것」 추천. 장보기 리스트까지 자동 — 실제로 써보면 음식물 쓰레기가 줄어드는 체감이 있어요.<br><br>
<b style="color:#E8837A;">2) 에어컨 · 공기질</b><br>
미세먼지, 습도, 재실 여부, 전력 요금 시간대를 같이 보고 풍량 조절. 「내가 안 불편한데 왜 세게 돌아?」 하는 날이 줄어듭니다.<br><br>
<b style="color:#E8837A;">3) 로봇청소기 · 세탁기</b><br>
동선·먼지량·스케줄 학습해서 「출근 후 거실 먼저」 같은 우선순위 변경. 생각보다 가족 패턴 따라가는 속도가 빨라요.<br><br>
<b style="color:#E8837A;">4) 조명 · 보안</b><br>
「배송 온 것 같다」는 패턴에 현관 조명 + 카메라 각도 변경. 단순 타이머보다 훨씬 자연스럽게 느껴졌습니다.<br><br>
<b style="color:#E8837A;">5) 고장 예측 · A/S</b><br>
모터 소리·진동 이상을 미리 잡아 「교체 시기」 알림 — 이건 돈 아끼는 쪽으로 체감 큽니다.
</div>

<p style="text-align:center; margin:24px 0;">
<img src="blog_ai_inference_03_ac.png" alt="에어컨" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">⚖️ 장점과 단점 — 광고 말고 현실 버전</p>
<p style="{body}">
<b>장점</b><br>
✅ 반복 결정(온도, 청소, 식단) 부담이 확 줄어요 — 특히 맞벌이·육아 집에서요.<br>
✅ 전기·수도·식재료 낭비 감소. 「알아서 아껴준다」는 말이 막연하지 않게 느껴집니다.<br>
✅ 나이 드신 부모님 댁처럼 조작이 어려운 환경에도 도움 될 수 있어요.<br><br>
<b>단점 · 주의할 점</b><br>
❌ <b>개인정보</b> — 생활 패턴이 데이터가 됩니다. 보관 기간·삭제 방법 꼭 확인하세요.<br>
❌ <b>브랜드 갇힘</b> — A사 허브에 묶이면 B사 기기 연동이 귀찮아질 수 있어요. Matter 지원 여부 체크!<br>
❌ <b>업데이트 중단</b> — 3년 뒤 AI 모델 지원 끊기면 「똑똑했던 가전」이 그냥 가전이 됩니다…<br>
❌ <b>오작동 학습</b> — 초기 2~4주는 패턴을 잘못 읽을 수 있어요. 저도 로봇청소기가 주말 아침에 돌아서 한동안 스케줄 손봤습니다 ㅋㅋ<br><br>
<b>SuN 팁</b> — 스펙표의 「AI」 문구만 보지 말고, <b>온디바이스 NPU 유무·업데이트 기간·로컬 처리 비율</b>까지 같이 보세요.
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_ai_inference_04_robot.png" alt="로봇청소기" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">☁️ vs 📱 온디바이스 — 뭐가 더 나을까?</p>
<div style="{box}">
<b style="color:#E8837A;">클라우드 방식</b> — 모델 업데이트 빠름, 복잡한 추론 가능 / 인터넷 필수, 지연·해킹 우려<br>
<b style="color:#E8837A;">온디바이스 방식</b> — 빠른 반응, 프라이버시 유리 / 칩 성능·발열·가격 부담<br><br>
<b style="color:#8A8580;">현실적인 결론:</b> 민감한 영상·음성은 로컬, 무거운 분석은 클라우드 — <b>하이브리드</b>가 대세로 보입니다. 앞으로 나올 프리미엄 가전 대부분이 이 구조일 거예요.
</div>

<p style="text-align:center; margin:24px 0;">
<img src="blog_ai_inference_05_chip.png" alt="온디바이스 칩" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">❓ 자주 묻는 질문 (FAQ)</p>
<p style="{body}">
<b>Q. 지금 사도 될까요, 아니면 2년 기다릴까요?</b><br>
A. 급하게 바꿀 필요는 없어요. 다만 <b>지금 살 거라면</b> Wi-Fi 6·Matter·2FA 지원 정도는 미래 대비로 챙기면 좋습니다.<br><br>
<b>Q. AI 가전이면 전기세 많이 나오나요?</b><br>
A. 추론 칩은 쓸 때만 전력을 씁니다. 오히려 에어컨·냉장고 최적화로 <b>줄어드는 경우</b>가 많다고 봐요. 다만 항상 대기하는 허브·카메라는 별개!<br><br>
<b>Q. 인터넷 끊기면 멍청해지나요?</b><br>
A. 온디바이스 비중이 큰 모델은 기본 기능 유지하는 편이에요. 구매 전 「오프라인 동작 범위」 꼭 물어보세요.
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_ai_inference_06_compare.png" alt="비교" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">🧭 지금 우리가 준비할 수 있는 것</p>
<p style="{body}">
1️⃣ 가전 살 때 <b>AI 업데이트 지원 기간</b> 확인 (3년? 5년?)<br>
2️⃣ 스마트허브·공유기 <b>2FA + 게스트 네트워크</b> 분리<br>
3️⃣ Matter·Thread 지원 기기 위주로 맞추기 — 나중에 갈아엎기 덜 아픔<br>
4️⃣ 「자동화」를 한 번에 10개 넣지 말고 <b>하나씩 테스트</b> — 오작동 줄이는 제일 쉬운 방법이에요.<br><br>
이 네 가지만 해도 AI 추론 가전이 본격 들어올 때 훨씬 덜 당황합니다. 저도 이 순서로 우리 집 바꿔가고 있어요.
</p>

<p style="{sub}">💡 SuN의 솔직 한줄평</p>
<p style="{body}">
미래 가전의 AI 추론은 「신기한 데모」가 아니라 <b>집안일 결정을 대신해 주는 비서</b>에 가깝습니다.<br>
처음에는 과장될 수 있지만, 2~3년 안에 중가 라인에도 내려올 거고 — 그때 중요한 건 칩 스펙보다 <b>우리 생활에 맞게 학습되느냐</b>예요.<br><br>
여러분은 어떤 가전에 AI 추론이 먼저 들어오면 좋겠어요? 냉장고? 에어컨? 로봇청소기? 댓글로 알려주시면 다음엔 <b>브랜드별 비교</b>도 써볼게요~ 👋
</p>

<p style="{tags}">{tagline}</p>
""",
    },
    6: {
        "title": "AI는 내 개인 데이터를 어디까지 저장하고, 얼마나 보관할까?",
        "slug": "AI_개인데이터_보관",
        "images": [
            {
                "file": "blog_ai_data_01_phone.png",
                "alt": "스마트폰 AI 설정",
                "prompt": "person scrolling AI app privacy settings on smartphone at kitchen table, morning light",
                "shot": "hero",
            },
            {
                "file": "blog_ai_data_02_chat.png",
                "alt": "채팅 기록",
                "prompt": "laptop screen showing chat history with AI assistant, coffee mug nearby, home office",
                "shot": "use",
            },
            {
                "file": "blog_ai_data_03_server.png",
                "alt": "데이터 센터",
                "prompt": "view from apartment window of city buildings, person thinking about cloud data, subtle mood",
                "shot": "lifestyle",
            },
            {
                "file": "blog_ai_data_04_delete.png",
                "alt": "데이터 삭제",
                "prompt": "finger tapping delete account button on tablet privacy screen, close-up hands",
                "shot": "detail",
            },
            {
                "file": "blog_ai_data_05_compare.png",
                "alt": "서비스 비교",
                "prompt": "notebook with handwritten comparison table of AI services on wooden desk, pen and phone",
                "shot": "compare",
            },
            {
                "file": "blog_ai_data_06_safe.png",
                "alt": "안전한 사용",
                "prompt": "cozy evening living room person reading terms on phone, warm lamp light",
                "shot": "closing",
            },
        ],
        "tags": "#AI개인정보 #데이터보관 #ChatGPT #프라이버시 #가전덕후 #SuN #GDPR #디지털권리 #스마트홈 #보안",
        "must_include": {"must_keywords": ["보관"], "min_list_items": 3},
        "html": """
<p style="{body}">
안녕하세요~가전덕후 SuN 입니다 😊<br><br>
ChatGPT·Gemini·빅스비·ThinQ… 요즘은 하루에도 AI를 몇 번씩 쓰게 되는데, 문득 이런 생각 들지 않으세요?<br>
<b>「내가 친 건 대화인데, AI 회사는 그걸 어디까지 저장하고, 얼마나 들고 있지?」</b><br>
저도 처음에는 그냥 편해서 썼는데, 한 번 약관을 읽어보고 나서 설정을 싹 바꿨거든요 ㅎㅎ<br>
오늘은 <b>AI 서비스의 개인 데이터 저장 범위·보관 기간·삭제 방법</b>까지 SuN이 정리해볼게요!
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_ai_data_01_phone.png" alt="AI 설정" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">📂 AI가 저장하는 데이터 — 생각보다 넓어요</p>
<p style="{body}">
많은 분이 「대화 내용만 저장」이라고 생각하시는데, 실제로는 더 넓을 수 있어요.<br><br>
• <b>프롬프트·응답 텍스트</b> (당연히 포함)<br>
• <b>업로드 파일</b> — PDF, 사진, 음성<br>
• <b>사용 패턴</b> — 접속 시간, 기능 클릭, 오류 로그<br>
• <b>기기·계정 정보</b> — OS, 브라우저, IP 대역<br>
• <b>연동 서비스 데이터</b> — 이메일·캘린더·스마트홈 상태 (권한 준 경우)<br><br>
가전 쪽 AI도 비슷합니다. 스마트냉장고·로봇청소기가 <b>집 안 패턴</b>을 학습하면, 그건 곧 개인 데이터예요.<br>
직접 사용하면서 느낀 점은 — 「무료」일수록 데이터 활용 조항을 더 꼼꼼히 봐야 한다는 거였어요.
</p>

<p style="{sub}">⏱️ 얼마나 보관할까? — 서비스마다 다릅니다</p>
<div style="{box}">
<b style="color:#E8837A;">대화형 AI (ChatGPT·Claude·Gemini 등)</b><br>
• 계정 설정에 <b>「학습에 사용 안 함」</b> 옵션 있는 경우 많음 — 꺼두는 걸 추천<br>
• 보관 기간은 정책 개정이 잦아서 <b>분기마다 한 번</b> 확인하는 게 안전<br>
• 유료·기업용은 보관·학습 범위가 다를 수 있음<br><br>
<b style="color:#E8837A;">스마트홈·가전 AI</b><br>
• 영상·음성: 클라우드 보관 vs 로컬만 저장 — 제품마다 다름<br>
• 일부는 7~30일 롤링 삭제, 일부는 계정 탈퇴 전까지 유지<br><br>
<b style="color:#E8837A;">해외 서비스 + GDPR</b><br>
• EU 사용자는 삭제 요청 권리가 강함. 국내 사용자도 정책상 비슷한 메뉴 제공하는 경우 많아요.
</div>

<p style="text-align:center; margin:24px 0;">
<img src="blog_ai_data_02_chat.png" alt="채팅 기록" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">🔍 왜 보관하나? — 이유를 알면 대응이 쉬워요</p>
<p style="{body}">
회사 입장에선 ① <b>서비스 품질 개선</b> ② <b>맞춤 추천</b> ③ <b>법적 분쟁 대비</b> ④ <b>악용 탐지</b> 때문에 로그를 남깁니다.<br>
나쁜 것만은 아니에요. 다만 <b>내 민감 정보</b>까지 오래 들고 있으면 문제 — 건강·재정·주소·가족 이야기 같은 것들이죠.<br><br>
SuN이 실수로 한 적이 있는데, AI에게 「우리 집 주소로 배송 비교해줘」라고 친 거예요 😅 그 뒤로는 <b>식별 정보는 치환</b>해서 씁니다. (예: ○○아파트 → A아파트)
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_ai_data_03_server.png" alt="클라우드" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">🛡️ 내가 지금 할 수 있는 설정 7가지</p>
<p style="{body}">
1️⃣ <b>학습 옵트아웃</b> — 설정에서 「모델 학습에 사용」 끄기<br>
2️⃣ <b>대화 기록 삭제</b> — 주기적으로 비우기 (민감한 건 즉시)<br>
3️⃣ <b>2단계 인증</b> — 계정 탈취 방지<br>
4️⃣ <b>가전 카메라·마이크</b> — 안 쓰는 기기는 물리적으로 가리거나 전원 OFF<br>
5️⃣ <b>게스트 네트워크</b> — IoT 기기 분리<br>
6️⃣ <b>유료 플랜 검토</b> — 무료 vs 유료의 데이터 정책 차이 읽어보기<br>
7️⃣ <b>회사·학교 계정</b> — 개인 Gmail과 분리 (섞이면 관리 더 어려움)<br><br>
이 중에서 1·2·4만 해도 체감 보안이 꽤 올라갑니다. 생각보다 설정 메뉴가 깊숙이 있어서 한번 시간 내서 찾아보세요!
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_ai_data_04_delete.png" alt="삭제" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">⚖️ 장점과 단점 — 데이터를 남기는 것</p>
<p style="{body}">
<b>남겨둘 때 좋은 점</b><br>
✅ AI가 나를 더 잘 이해 — 긴 프로젝트·반복 질문에 유리<br>
✅ 기기 연동·자동화가 매끄러움<br><br>
<b>리스크</b><br>
❌ 계정 해킹 시 한꺼번에 노출<br>
❌ 정책 변경 시 예전 대화도 새 규칙 적용될 수 있음<br>
❌ 가족 사진·아이 정보는 특히 조심<br><br>
<b>SuN 팁</b> — 「편함」과 「프라이버시」 중 어디에 더 비중 둘지 미리 정해 두면 서비스 고르기 쉬워요.
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_ai_data_05_compare.png" alt="비교" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">❓ 자주 묻는 질문</p>
<p style="{body}">
<b>Q. 삭제하면 진짜 다 지워지나요?</b><br>
A. 100% 보장은 어렵습니다. 백업·법적 보관 분리 저장이 있을 수 있어요. 가장 민감한 건 <b>애초에 입력 안 하는 것</b>이 최선.<br><br>
<b>Q. 가전 AI는요?</b><br>
A. 앱에서 「음성 기록 삭제」「사용 이력 초기화」 메뉴 확인. 안 보이면 고객센터에 <b>보관 기간</b> 문의하세요.<br><br>
<b>Q. 오프라인 AI는 안전한가요?</b><br>
A. 네트워크 전송은 줄지만, 기기 자체 저장은 남습니다. 팔거나 버릴 때 <b>공장 초기화</b> 필수!
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_ai_data_06_safe.png" alt="안전한 사용" style="max-width:100%; border-radius:12px;" />
</p>


<p style="{sub}">📋 서비스별 보관 — SuN이 메모해 둔 기준 (2026년, 변경 가능)</p>
<p style="{body}">
정책은 자주 바뀌어서 <b>분기마다 재확인</b>하세요. 대략적인 감만 잡아도 설정 동기가 생깁니다.<br>
• <b>ChatGPT</b> — 학습 opt-out 가능, 대화 기록 계정에 남음 → 주기 삭제<br>
• <b>Google Gemini</b> — 활동 기록·YouTube 연동 범위 별도<br>
• <b>가전 ThinQ/SmartThings</b> — 영상·음성 클라우드 보관 기간 제품별 상이<br>
• <b>국내 통신·포털 AI</b> — 「데이터 활용」 항목 한 줄씩이라도 읽기<br><br>
「무료 = 내 데이터가 값」 구조인 경우가 많아서, SuN은 <b>민감 프로젝트는 유료·기업</b> 또는 <b>로컬</b> 쪽을 고려합니다.
</p>


<p style="{body}">
<b>SuN 한마디 더</b> — 글에서 정리한 내용은 「정답」이라기보다 <b>우리 집 기준 참고</b>예요. 제품·정책·법규는 바뀔 수 있으니, 구매·설정 전에는 공식 안내도 한번 더 확인해 주세요. 비슷한 경험 있으시면 댓글로 공유해 주시면 다음 글에 반영할게요 😊
</p>

<p style="{sub}">💡 SuN의 솔직 한줄평</p>
<p style="{body}">
AI는 편하지만, <b>데이터는 내가 관리</b>해야 해요. 약관이 지루해도 「보관 기간·학습 사용」만큼은 꼭 보세요.<br>
저는 민감한 얘기는 AI에 안 하고, 가전은 <b>로컬 처리 비중 큰 제품</b>을 우선 보고 있습니다.<br><br>
여러분은 AI 대화 기록 주기적으로 지우시나요? 댓글로 팁 공유해 주시면 같이 배울게요~ 👋
</p>

<p style="{tags}">{tagline}</p>
""",
    },
}
POSTS_DB.update(POSTS_DB_1_4)
POSTS_DB.update(POSTS_DB_7_14)


def load_used() -> set[int]:
    if not USED.exists():
        return set()
    try:
        data = json.loads(USED.read_text(encoding="utf-8"))
        return set(int(x) for x in data.get("used", []))
    except Exception:
        return set()


def ideas_path() -> Path:
    if IDEAS_MD.exists():
        return IDEAS_MD
    return IDEAS_TXT


def parse_ideas_file() -> list[tuple[int, str]]:
    path = ideas_path()
    if not path.exists():
        return []
    out: list[tuple[int, str]] = []
    auto_id = 0
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or len(line) < 5:
            continue
        m = re.match(r"^\s*(\d+)\.\s*(.+)", line)
        if m:
            title = m.group(2).strip()
            if len(title) >= 3:
                out.append((int(m.group(1)), title))
        else:
            auto_id += 1
            out.append((auto_id, line))
    return out


def pick_idea_id() -> int:
    used = load_used()
    ideas = parse_ideas_file()
    for iid, title in ideas:
        if iid in used:
            continue
        if iid in POSTS_DB:
            return iid
        print(f"[경고] 아이디어 {iid} ({title}) — 본문 템플릿 없음, 다음으로")
    for iid, title in ideas:
        if iid not in used:
            raise SystemExit(f"아이디어 {iid} ({title}) 본문이 없습니다. POSTS_DB에 추가 필요.")
    raise SystemExit("남은 아이디어가 없습니다.")


def save_used(used: set[int]) -> None:
    USED.write_text(
        json.dumps({"used": sorted(used), "updated": date.today().isoformat()}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def make_images_for_spec(spec: dict) -> list[str]:
    img_names: list[str] = []
    for item in spec["images"]:
        if isinstance(item, dict):
            fname = item["file"]
            prompt = item.get("prompt", item.get("alt", spec["title"]))
            style = item.get("style", "photo")
            shot = item.get("shot", "lifestyle")
        else:
            fname, alt = item[0], item[1] if len(item) > 1 else spec["title"]
            prompt = alt
            style = "photo"
            shot = "lifestyle"
        path = IMAGES / fname
        ok = create_blog_image(prompt, path, style=style, shot=shot)
        if not ok:
            print(f"[이미지] 경고: {fname} 생성 실패")
        img_names.append(fname)
        time.sleep(2)
    return img_names


def get_idea_raw_title(idea_id: int) -> str:
    for iid, title in parse_ideas_file():
        if iid == idea_id:
            return title
    return ""


def render_post(idea_id: int, *, post_date: str | None = None) -> tuple[Path, list[str]]:
    spec = POSTS_DB[idea_id]
    raw_title = get_idea_raw_title(idea_id) or spec.get("title", "")
    clean_title, _ = parse_idea_title(raw_title)

    req = infer_requirements(raw_title)
    req = merge_requirements(req, spec.get("must_include"))

    today = post_date or date.today().isoformat()
    out_html = POSTS / f"{today}_{idea_id:02d}_{spec['slug']}_임시저장용.html"
    img_names = make_images_for_spec(spec)

    body_html = spec["html"].format(
        body=BODY,
        sub=SUB,
        box=BOX,
        tags=TAGS,
        tagline=spec["tags"],
    )
    body_html = inject_dynamic_blocks(body_html, req.dynamic_blocks)

    errors = validate_post_html(body_html, req, clean_title or raw_title)
    if errors:
        print("[검증 실패] 아이디어 핵심 내용 누락:")
        for e in errors:
            print(f"  - {e}")
        raise SystemExit(1)

    quality_errors, quality_warnings = validate_quality(body_html)
    for w in quality_warnings:
        print(f"[품질 권장] {w}")
    if quality_errors:
        print("[검증 실패] 블로그 품질 기준 미달:")
        for e in quality_errors:
            print(f"  - {e}")
        raise SystemExit(1)

    print(f"[검증] 필수 요구사항 + 품질 기준 OK — 유형: {req.post_type}")
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
    ap.add_argument("--idea-id", type=int, default=0, help="특정 아이디어 번호로 생성")
    ap.add_argument("--force", action="store_true", help="오늘 글 있어도 재생성")
    ap.add_argument("--prepare-date", type=str, default="", help="파일명 날짜 (YYYY-MM-DD)")
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

    post_date = args.prepare_date.strip() or date.today().isoformat()
    today = date.today().isoformat()

    if args.idea_id:
        idea_id = args.idea_id
        if idea_id not in POSTS_DB:
            print(f"아이디어 {idea_id} 본문 없음")
            return 1
    else:
        if not args.force:
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

    html_path, images = render_post(idea_id, post_date=post_date)
    if not args.idea_id or args.force:
        used = load_used()
        used.add(idea_id)
        save_used(used)
    meta = ROOT / "logs" / "latest_post.json"
    meta.parent.mkdir(parents=True, exist_ok=True)
    meta.write_text(
        json.dumps(
            {
                "date": post_date,
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
