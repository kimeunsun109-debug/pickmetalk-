"""POSTS_DB 템플릿 — 아이디어 1~4 (Premium v3)"""

POSTS_DB_1_4: dict[int, dict] = {
    1: {
        "title": "LG전자, 역대 최대 실적은 어떻게 나왔을까? — 숫자 뒤에 숨은 이유 쉽게 풀어봤어요",
        "slug": "LG전자_역대최대실적_분석",
        "images": [
            {"file": "blog_lg_01_tv_showroom.png", "alt": "LG전자 TV 전시", "prompt": "LG OLED TV display in electronics store showroom, customer browsing, soft indoor lighting", "shot": "hero"},
            {"file": "blog_lg_02_earnings.png", "alt": "실적 기사", "prompt": "person reading earnings news on tablet at home desk, coffee mug, morning window light", "shot": "use"},
            {"file": "blog_lg_03_appliance.png", "alt": "생활가전", "prompt": "modern kitchen with LG style refrigerator and washer, Korean apartment interior, lived-in feel", "shot": "lifestyle"},
            {"file": "blog_lg_04_vehicle.png", "alt": "전장·배터리", "prompt": "EV battery pack and automotive electronics components on workshop table, tech blogger hands", "shot": "detail"},
            {"file": "blog_lg_05_compare.png", "alt": "사업부 비교", "prompt": "handwritten bar chart comparing business segments on notebook, pen and calculator on wooden desk", "shot": "compare"},
            {"file": "blog_lg_06_closing.png", "alt": "거실 TV 시청", "prompt": "family watching TV in cozy living room evening, warm lamp light, casual smartphone photo feel", "shot": "closing"},
        ],
        "tags": "#LG전자 #실적 #OLED #가전 #전장 #배터리 #가전덕후 #SuN #주식 #IT #생활가전 #CES",
        "must_include": {"must_keywords": ["왜"], "min_list_items": 3},
        "html": """
<p style="{body}">
안녕하세요~가전덕후 SuN 입니다 😊<br><br>
뉴스 틀면 LG전자 「역대 최대 실적」 기사가 자주 보이더라고요. 솔직히 처음엔 「또 올랐구나」 정도로만 넘겼는데, 막상 우리 집에 LG TV·세탁기가 있는 입장에서 궁금해졌어요.<br>
<b>숫자는 좋아 보이는데, 도대체 어디서 돈이 나온 걸까?</b> 가전만 잘 팔린 건지, 다른 사업도 끼어 있는지 — 오늘은 뉴스 말투 말고 SuN이 이해한 대로 풀어볼게요!
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_lg_01_tv_showroom.png" alt="LG TV 전시" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">📊 「역대 최대 실적」 — 뭘 의미하나요?</p>
<p style="{body}">
실적 발표에서 자주 나오는 말이에요. 보통 <b>매출</b>이든 <b>영업이익</b>이든 과거 분기·연간 기록을 갈아치웠다는 뜻이죠.<br><br>
LG전자는 TV·냉장고 같은 <b>생활가전(H&A)</b>, <b>HE</b>(디스플레이·전자부품), <b>VS</b>(차량용 전장·배터리) 등 사업부가 여러 개예요. 그래서 「LG전자 실적 좋다」 한 줄로 끝내면, 실제로는 <b>어느 부문이 끌어올렸는지</b>를 봐야 감이 옵니다.<br>
저도 처음에는 헷갈렸는데, 분기 실적 요약표에서 사업부별 영업이익만이라도 한번 훑어보니 훨씬 이해가 빨라졌어요 ㅎㅎ
</p>

<p style="{sub}">📺 ① TV·OLED — 여전히 강한 프리미엄 축</p>
<p style="{body}">
거실 TV 고를 때 OLED vs QLED 비교해 보신 분 많으실 거예요. LG는 OLED 쪽에서 <b>프리미엄 시장</b>을 오래 밀어왔고, 고가 TV 비중이 높을수록 이익률에 도움이 됩니다.<br><br>
<b>체감 포인트</b><br>
• 대형·고급 TV 수요 — 65인치 이상, 게이밍·홈시어터 니즈<br>
• 패널·브랜드 프리미엄 — 「그냥 TV」가 아니라 「거실 중심」으로 파는 전략<br>
• 환율·원자재 — 이건 기업 입장에선 변수지만, 가격 전략과 같이 움직임<br><br>
우리 집도 OLED 쓰는데, 밝은 낮에는 유리 반사가 신경 쓰이긴 해도 <b>야간 영화 감상</b>은 생각보다 만족도가 높았어요. 실적 이야기랑 연결하면 「프리미엄 TV를 고르는 사람」이 줄지 않았다는 쪽으로 읽을 수 있죠.
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_lg_02_earnings.png" alt="실적 기사" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">🏠 ② 생활가전 — 조용히, 꾸준히</p>
<p style="{body}">
TV보다 덜 화려해 보이지만, 냉장고·세탁기·건조기·식기세척기는 <b>교체 주기가 길어도 시장이 큽니다.</b><br>
• <b>프리미엄·스팀·AI 기능</b> — ThinQ 연동, 에너지 효율, 맞춤 세탁 같은 프리미엄 라인이 이익에 기여<br>
• <b>북미·유럽</b> — 해외 가전 시장에서 브랜드 인지도가 실적과 직결<br>
• <b>원가·물류</b> — 컨테이너·부품값이 안정되면 가전 이익이 한결 편해지는 편<br><br>
「AI 냉장고」 같은 말은 마케팅처럼 들리지만, 실제로는 <b>센서·카메라·앱 연동</b>이 붙으면서 고가 모델 비중이 늘어나는 흐름이랑 맞닿아 있어요. 다음 글에서 냉장고 AI도 따로 다룰 예정이에요!
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_lg_03_appliance.png" alt="생활가전" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">🔋 ③ 전장·배터리 — 숫자를 바꾸는 변수</p>
<p style="{body}">
요즘 실적 기사에서 자주 등장하는 게 <b>전장(VS)</b> 쪽이에요. 전기차·하이브리드가 늘면 배터리·전자부품 수요도 같이 올라가죠.<br>
• 배터리·전력전자 — ESS(에너지 저장)까지 엮이면 「가전 회사」 이미지를 넘어섭니다<br>
• 자동차 OEM과의 관계 — 장기 계약·물량이 실적 변동성을 줄이는 경우도<br>
• 기술 전환 — LFP·4680 같은 배터리 트렌드는 뉴스만 봐도 어렵지만, 「전장이 성장 사업」이라는 큰 그림은 기억해 두면 좋아요<br><br>
가전덕후 입장에선 멀게 느껴질 수 있는데, <b>LG전자 주가·실적 얘기</b>를 들을 때 「TV만 보지 말 것」 정도로 알아두면 뉴스 읽기가 덜 허전합니다.
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_lg_04_vehicle.png" alt="전장·배터리" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">⚖️ 왜 지금 역대급이 나올 수 있었을까?</p>
<div style="{box}">
<b style="color:#E8837A;">프리미엄·고부가 제품 비중 ↑</b> — 싼 물량보다 마진 좋은 제품<br>
<b style="color:#E8837A;">사업 포트폴리오 분산</b> — TV 한 방이 아니라 전장·가전·부품이 같이 받쳐 줌<br>
<b style="color:#E8837A;">비용 구조 조정</b> — 생산·물류·재고 관리 (기업마다 시기는 다름)<br>
<b style="color:#E8837A;">환율·수요 사이클</b> — 해외 매출 비중 큰 회사는 환율이 체감에 크게 작용<br><br>
<b style="color:#8A8580;">주의</b> — 「역대 최대」는 <b>그 시점</b>의 기록이에요. 다음 분기에 원자재·수요가 바뀌면 달라질 수 있습니다. 투자 판단은 뉴스 한 줄로 끝내기보다 공시·사업부별 숫자를 보는 게 안전해요.
</div>

<p style="text-align:center; margin:24px 0;">
<img src="blog_lg_05_compare.png" alt="사업부 비교" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">🛒 우리 소비자한테는 뭐가 달라지나?</p>
<p style="{body}">
실적이 좋다고 내일 TV가 싸지진 않아요 ㅋㅋ 다만 이런 연결은 있어요.<br>
• <b>R&D·신제품</b> — OLED·무드업·AI 가전 같은 신기능 출시 속도<br>
• <b>A/S·펌웨어</b> — 장기적으로 OS·ThinQ 업데이트를 얼마나 밀어줄지<br>
• <b>프로모션</b> — 분기 말·연말에 세일 폭이 달라질 수 있음<br><br>
<b>추천</b> — 실적 뉴스 볼 때 「어떤 사업부가 좋았는지」만 체크해 두고, 내가 살 가전은 <b>우리 집 사용 환경</b> 기준으로 고르세요. SuN은 여전히 스펙表보다 <b>실사용 후기·A/S 후기</b>를 더 믿는 편이에요.
</p>

<p style="{sub}">❓ 자주 묻는 질문</p>
<p style="{body}">
<b>Q. 실적 좋으면 주식만 보면 되나요?</b><br>
A. 투자는 개인 판단이에요. 실적은 참고 자료 중 하나일 뿐, 전망·valuation·리스크도 봐야 합니다.<br><br>
<b>Q. 삼성전자랑 뭐가 다르게 읽나요?</b><br>
A. 사업 구조가 달라요. 반도체 비중·가전·디스플레이 비중이 회사마다 다르니 같은 「최대 실적」이라도 원인 분석이 달라집니다.<br><br>
<b>Q. 가전 살 때 실적 뉴스 참고할 만한가요?</b><br>
A. 「회사가 버티고 R&D를 밀어주는지」 정도의 간접 신호로는 OK. 모델 선택은 여전히 리뷰·매장 시연·우리 집 설치 조건이 우선!
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_lg_06_closing.png" alt="거실 TV" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">💡 SuN의 솔직 한줄평</p>
<p style="{body}">
LG전자 역대 최대 실적은 <b>TV만 잘 팔린 게 아니라</b>, 프리미엄 가전·전장·부품이 겹치면서 나온 그림에 가깝다고 이해했어요.<br>
뉴스 헤드라인만 보면 멀게 느껴지는데, 사업부별로 한번 쪼개 보면 「아, 우리 거실 TV랑도 연결되네」 싶더라고요.<br><br>
집에 LG 가전 뭐 쓰고 계세요? TV인지 세탁기인지 댓글로 알려주시면, 그 제품 위주로 후기도 이어서 써볼게요~ 👋
</p>

<p style="{tags}">{tagline}</p>
""",
    },
    2: {
        "title": "냉장고 AI 기능, 왜 필요할까? — 막상 써보니 체감은 이랬어요",
        "slug": "냉장고_AI기능_왜필요",
        "images": [
            {"file": "blog_fridge_ai_01_kitchen.png", "alt": "주방 냉장고", "prompt": "Korean apartment kitchen with modern smart refrigerator, natural daylight, slightly cluttered counter", "shot": "hero"},
            {"file": "blog_fridge_ai_02_inside.png", "alt": "냉장고 내부", "prompt": "open refrigerator door showing vegetables leftovers and drinks, person reaching in casually", "shot": "use"},
            {"file": "blog_fridge_ai_03_app.png", "alt": "ThinQ 앱", "prompt": "smartphone showing refrigerator inventory app on kitchen table, close-up hands", "shot": "detail"},
            {"file": "blog_fridge_ai_04_camera.png", "alt": "내부 카메라", "prompt": "interior fridge camera view on phone screen while person shops at supermarket aisle", "shot": "lifestyle"},
            {"file": "blog_fridge_ai_05_energy.png", "alt": "에너지 절약", "prompt": "electricity bill and energy label sticker on appliance, desk comparison shot", "shot": "compare"},
            {"file": "blog_fridge_ai_06_family.png", "alt": "가족 장보기", "prompt": "family unpacking groceries into refrigerator together, warm evening kitchen light", "shot": "closing"},
        ],
        "tags": "#냉장고 #AI #스마트냉장고 #ThinQ #SmartThings #가전덕후 #SuN #주방 #식재료 #에너지절약 #스마트홈",
        "must_include": {"must_keywords": ["왜"], "require_pros": True, "require_cons": True},
        "html": """
<p style="{body}">
안녕하세요~가전덕후 SuN 입니다 😊<br><br>
냉장고 사려고 매장 가면 「AI 냉장고」「스마트 냉장고」 문구가 붙어 있죠. 솔직히 처음엔 「그냥 시원하면 되지 않나…」 싶었어요 ㅋㅋ<br>
그런데 막상 ThinQ·SmartThings 연동 써보고, 내부 카메라로 장보기 전에 확인해 본 뒤에는 생각이 조금 바뀌었거든요.<br>
오늘은 <b>냉장고 AI 기능이 왜 필요한지</b> — 광고 말고 SuN이 느낀 장단점·돈값 하는지까지 길게 정리해볼게요!
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_fridge_ai_01_kitchen.png" alt="주방 냉장고" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">🤔 냉장고 AI는 뭘 해주나요?</p>
<p style="{body}">
「AI」라고 하면 뭐든 똑똑해 보이지만, 냉장고에서 실제로 하는 일은 대체로 이 정도예요.<br><br>
• <b>내부 카메라</b> — 문 열 때·앱으로 안에 뭐 있는지 확인<br>
• <b>유통기한·식재료 힌트</b> — 인식·수동 입력 기반 (모델마다 차이 큼)<br>
• <b>온도·모드 자동 조절</b> — 문 열림 횟수·계절·사용 패턴 반영<br>
• <b>에너지 절약</b> — 사용 적은 시간대 쿨링 조절<br>
• <b>레시피·장보기 연동</b> — 앱에서 부족한 재료 추천 (체감은 사람마다 다름)<br><br>
<b>왜 필요하냐</b>고 물으면 — 한 줄로는 「<b>냉장고를 열어보지 않고도 상태를 알고, 낭비를 줄이자</b>」에 가깝습니다. 냉장고는 하루에도 여러 번 여는 가전이라, 그 패턴을 데이터로 쓰겠다는 거죠.
</p>

<p style="{sub}">✨ 장점 — 막상 써보니 이런 점이 편했어요</p>
<div style="{box}">
<b style="color:#E8837A;">① 장보기 전 「뭐 있지?」 해결</b><br>
마트 가기 전에 앱으로 내부 사진 보는 게 생각보다 자주 씁니다. 특히 둘이 「우유 사와」 「있어?」 할 때 ㅎㅎ<br><br>
<b style="color:#E8837A;">② 유통기한 놓치는 일 ↓</b><br>
100% 자동은 아니어도, 앱 알림·수동 등록 습관 들이면 버리는 채소가 줄어드는 느낌이 있어요.<br><br>
<b style="color:#E8837A;">③ 온도·모드 최적화</b><br>
「휴가 모드」「급속 냉동」 같은 걸 앱에서 원격으로 — 출장 전에 쓰면 마음이 편함<br><br>
<b style="color:#E8837A;">④ 에너지·소음</b><br>
프리미엄 모델은 인버터·AI 절전으로 한 달 전기세 차이가 아주 조금이라도 나는 경우도 (집 전체 사용량에 따라 다름)
</div>

<p style="text-align:center; margin:24px 0;">
<img src="blog_fridge_ai_02_inside.png" alt="냉장고 내부" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">😅 단점·아쉬운 점 — 광고에 안 나오는 부분</p>
<p style="{body}">
<b>① 「AI」라고 다 같은 게 아님</b> — 카메라만 있는 모델, 인식까지 하는 모델, 가격 차이 큼<br>
<b>② 식재료 인식 정확도</b> — 포장지·겹친 재료는 아직 헷갈림. SuN은 중요한 건 직접 태그하는 편<br>
<b>③ 앱·Wi-Fi 의존</b> — 공유기 바꾸면 재연결 귀찮음. 펌웨어 업데이트 중단되면 「스마트」가 줄어듦<br>
<b>④ 프라이버시</b> — 내부 영상이 클라우드에 올라가는 구조면 설정·약관 확인 필수<br>
<b>⑤ 가격</b> — AI 기능 붙으면 50~100만 원 이상 차이 나는 경우 많음. 「꼭 필요?」는 가족 식습관에 달림<br><br>
저희는 1~2인 가구라 장보기 실수가 잦았는데, 그래서 체감이 컸어요. <b>대가족·장보기 고수</b>면 「그냥 열어보면 되지」일 수도 있습니다!
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_fridge_ai_03_app.png" alt="앱" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">🛒 이런 분께 추천 / 비추천</p>
<p style="{body}">
<b>추천</b><br>
• 장보기 전에 「집에 뭐 있지」 자주 확인하는 분<br>
• 유통기한·음식물 쓰레기 줄이고 싶은 분<br>
• ThinQ·SmartThings로 가전 통합 중인 분<br>
• 원격 근무·출장 많아서 냉장고 모드 바꿀 일 있는 분<br><br>
<b>비추천에 가까움</b><br>
• 냉장고 = 차갑게만 하면 OK, 앱 귀찮은 분<br>
• Wi-Fi·스마트홈 설정 스트레스 싫은 분<br>
• 예산 우선 — 같은 돈이면 용량·에너지등급에 투자하는 게 나을 수 있음
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_fridge_ai_04_camera.png" alt="내부 카메라" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">✅ 구매 전 체크리스트</p>
<p style="{body}">
1️⃣ <b>내부 카메라 유무</b> — AI라고 해도 카메라 없는 모델 있음<br>
2️⃣ <b>클라우드 vs 로컬</b> — 영상 저장 위치·보관 기간<br>
3️⃣ <b>앱 지원 기간</b> — 5년 뒤에도 ThinQ 업데이트?<br>
4️⃣ <b>용량·도어 방향·키친핏</b> — AI보다 설치가 먼저! 이건 진짜 중요<br>
5️⃣ <b>에너지효율 1등급</b> — AI 절전보다 등급이 체감 클 때도 많음<br><br>
매장에서 「AI 데모」만 보지 말고, <b>앱 UI 직접</b> 눌러보세요. 사용 빈도가 여기서 갈립니다.
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_fridge_ai_05_energy.png" alt="에너지" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">❓ 자주 묻는 질문</p>
<p style="{body}">
<b>Q. AI 없는 냉장고는 이제 안 사나요?</b><br>
A. 전혀요. 기본 냉장·냉동 잘하면 10년 씁니다. AI는 편의 옵션이에요.<br><br>
<b>Q. Wi-Fi 안 연결하면 AI 안 되나요?</b><br>
A. 원격·인식·알림은 대부분 Wi-Fi 필요. 오프라인은 기본 냉각만.<br><br>
<b>Q. LG vs 삼성 AI 냉장고?</b><br>
A. 생태계(ThinQ vs SmartThings) 맞추는 게 연동·습관에 유리. 기능표만 비교하지 말고 앱 써보세요.
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_fridge_ai_06_family.png" alt="장보기" style="max-width:100%; border-radius:12px;" />
</p>


<p style="{sub}">🔧 유지·관리 팁 — AI 냉장고 오래 쓰려면</p>
<p style="{body}">
냉장고는 10년 가전이라 AI도 <b>습관+관리</b>가 맞아야 해요.<br>
• <b>문 여는 시간</b> — AI가 똑똑해도 문 열어두면 전기·식품 모두 손해<br>
• <b>앱 알림 정리</b> — 알림이 너무 많으면 무시하게 됨. 중요 재료만 등록<br>
• <b>펌웨어</b> — 업데이트 미루면 인식률 떨어지는 느낌. Wi-Fi 안정적으로<br>
• <b>카메라 렌즈</b> — 기름때 묻으면 사진 흐림. 한 달에 한번 닦기<br><br>
저는 두 달째부터 <b>앱 안 여는 날</b>도 생겼는데, 장보기 직전 한번 보는 습관은 남았어요. 이 정도만 되어도 AI 값은 한다고 봅니다.
</p>


<p style="{sub}">💡 SuN의 솔직 한줄평</p>
<p style="{body}">
냉장고 AI는 「혁명」이라기보다 <b>장보기·낭비 줄이기 보조</b>에 가깝습니다. 우리 집에선 의외로 쓸 일이 많았어요.<br>
다만 비싼 AI만 보지 말고 — <b>용량·설치·에너지</b>가 맞는지 먼저 보고, 그다음 AI 옵션을 고르는 순서가 마음 편합니다.<br><br>
냉장고 AI 쓰고 계세요? 장보기 앱 자주 여시는지 댓글로 알려주세요~ 👋
</p>

<p style="{tags}">{tagline}</p>
""",
    },
    3: {
        "title": "가열식 가습기, 세균 없이 쓸 수 있을까? — 장단점 솔직 정리",
        "slug": "가열식가습기_장단점_세균",
        "images": [
            {"file": "blog_humid_01_winter.png", "alt": "겨울 거실", "prompt": "Korean living room winter dry air, humidifier steam visible, cozy blanket on sofa", "shot": "hero"},
            {"file": "blog_humid_02_boiling.png", "alt": "가열식 원리", "prompt": "heated humidifier boiling water chamber close-up, safe home appliance detail shot", "shot": "detail"},
            {"file": "blog_humid_03_clean.png", "alt": "세척", "prompt": "person cleaning humidifier water tank at kitchen sink, rubber gloves, realistic home", "shot": "use"},
            {"file": "blog_humid_04_ultrasonic.png", "alt": "초음파 vs 가열", "prompt": "two humidifiers side by side on table comparison, handwritten note labels", "shot": "compare"},
            {"file": "blog_humid_05_child.png", "alt": "아이 방", "prompt": "humidifier in child bedroom corner, soft night light, safety distance from bed", "shot": "lifestyle"},
            {"file": "blog_humid_06_meter.png", "alt": "습도계", "prompt": "digital hygrometer showing humidity percentage on desk near humidifier steam", "shot": "closing"},
        ],
        "tags": "#가습기 #가열식가습기 #초음파가습기 #세균 #겨울가전 #가전덕후 #SuN #건조 #아이방 #습도 #생활가전",
        "must_include": {"require_pros": True, "require_cons": True, "must_keywords": ["세균"]},
        "html": """
<p style="{body}">
안녕하세요~가전덕후 SuN 입니다 😊<br><br>
겨울만 되면 「가습기 살균」「가열식이면 세균 없다」 광고가 많죠. 저도 아이 키울 때 초음파 가습기 백수오 이슈 보고 한동안 무섭게 굴러다녔거든요 ㅠㅠ<br>
그래서 <b>가열식 가습기</b>로 바꿨는데 — 「정말 세균 걱정 없나?」 「단점은 없나?」 궁금한 게 한가지가 아니더라고요.<br>
오늘은 <b>가열식 가습기 장단점</b>을 SuN이 직접 써본 기준으로, 세균·관리·전기세까지 솔직하게 정리해볼게요!
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_humid_01_winter.png" alt="겨울 거실" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">💨 가열식 가습기 — 원리부터 알면 고르기 쉬워요</p>
<p style="{body}">
<b>초음파 가습기</b>는 물을 진동으로 안개처럼 뿜고, <b>가열식(가열가습)</b>은 물을 <b>끓여서</b> 수증기를 내보냅니다.<br><br>
끓이면 → <b>99% 이상 세균·바이러스가 사멸</b>한다는 설명을 많이 봤을 거예요. 실험실 조건과 실제 가정은 다를 수 있지만, 「차가운 물 그대로 분무」보다는 <b>위생 측면에서 유리한 편</b>인 건 맞아요.<br>
다만 「세균이 0」이 아니라 — <b>물탱크·출수구·주변 관리</b>를 소홀히 하면 여전히 문제 생깁니다. 「가열식이면 방치해도 된다」는 오해는 금물!
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_humid_02_boiling.png" alt="가열 원리" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">✅ 장점 — SuN이 체감한 부분</p>
<div style="{box}">
<b style="color:#E8837A;">① 위생·안심감</b> — 아이·노약자 방에 쓸 때 심리적 부담이 줄어듦<br>
<b style="color:#E8837A;">② 따뜻한 수증기</b> — 겨울에 방 온도랑 같이 올라가 체감 습도↑ (전기세는 별개 ㅎㅎ)<br>
<b style="color:#E8837A;">③ 백수오·미세분말 걱정 ↓</b> — 초음파식 white dust 이슈 상대적으로 적음 (수질·모델 따라 다름)<br>
<b style="color:#E8837A;">④ 살균 모드·자동 전원</b> — 일부 모델은 가열 후 냉각까지 설계<br><br>
<b style="color:#8A8580;">SuN 경험</b> — 초음파 쓸 때보다 「물 갈아주기」 스트레스는 줄었어요. 그래도 <b>매일 잔수 버리기</b>는 합니다.
</div>

<p style="{sub}">😅 단점 — 광고에서 잘 안 말해 주는 것</p>
<p style="{body}">
<b>① 전기세</b> — 끓이니까 초음파보다 전력 많이 씀. 밤새 풀가동하면 고지서 체감<br>
<b>② 소음·뜸</b> — 끓는 소리, 가열 시간 동안 습도 올라가는 속도가 느림<br>
<b>③ 뜨거운 증기·화상</b> — 아이 방은 <b>거리·난간</b> 필수. 출수구 근처 손 대지 않게<br>
<b>④ 석회·물때</b> — 수돗물 쓰면 가열판·탱크에 하얀 때. 정수·정기 세척 필요<br>
<b>⑤ 가격·부피</b> — 같은 가습량이면 초음파보다 크고 무거운 편<br><br>
「세균 없음」 ≠ 「관리 없음」 — 이 한 줄만 기억해도 반은 성공입니다!
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_humid_03_clean.png" alt="세척" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">🆚 초음파·가열식·기화식 — 한눈에 비교</p>
<div style="{box}">
<b style="color:#E8837A;">초음파</b> — 저렴·조용·습도 빠름 / 위생·white dust·관리 부담<br>
<b style="color:#E8837A;">가열식</b> — 위생·안심 / 전기·소음·느린 가습<br>
<b style="color:#E8837A;">기화식(자연기화)</b> — 필터로 증발·위생 중간 / 필터 교체 비용·속도<br><br>
<b style="color:#8A8580;">SuN 추천</b> — <b>아이·알레르기·위생 최우선</b> → 가열식 or 기화식 / <b>전기·예산</b> → 초음파+관리 철저 or 기화식
</div>

<p style="text-align:center; margin:24px 0;">
<img src="blog_humid_04_ultrasonic.png" alt="비교" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">🧼 세균 없이 쓰려면 — 관리 루틴 5가지</p>
<p style="{body}">
1️⃣ <b>매일 잔수 버리기</b> — 하루치 물만 쓰고 탱크 말리기<br>
2️⃣ <b>주 1~2회 세척</b> — 구연산·베이킹소다 or 전용 세정제 (제조사 권장)<br>
3️⃣ <b>정수·깨끗한 물</b> — 수돗물 그대로보다 정수기 물이 때 덜 남는 편<br>
4️⃣ <b>습도 40~60%</b> — 너무 높이면 곰팡이·진드기. <b>습도계</b> 필수!<br>
5️⃣ <b>여름엔 보관</b> — 안 쓸 땐 완전 건조 후 보관, 곰팡이 방지<br><br>
가열식이라도 <b>2주 방치한 물</b>은… SuN도 실험 안 합니다. 그냥 버리세요 😅
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_humid_05_child.png" alt="아이 방" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">🛒 구매 전 체크 · 전기세 감</p>
<p style="{body}">
• <b>가습량(ml/h)</b> — 방 크기(평수)에 맞게. 작으면 밤새 돌려도 건조<br>
• <b>저수조 용량</b> — 밤에 채울 양·보충 빈도<br>
• <b>타이머·습도 센서</b> — 과습·과전력 방지<br>
• <b>전기료</b> — 300~500W급 밤 8시간이면 월 수천~만 원대도 가능 (요금제·시간 따라)<br>
• <b>AS·부품</b> — 가열판·밸브 교체 가능 여부<br><br>
<b>전기세 아끼는 팁</b> — 습도 목표 도달하면 OFF, <b>가습+환기</b> 번갈아, 거실만 집중 가동
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_humid_06_meter.png" alt="습도계" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">❓ 자주 묻는 질문</p>
<p style="{body}">
<b>Q. 가열식이면 백수오 걱정 없나요?</b><br>
A. 초음파 white dust 이슈는 상대적으로 적은 편. 수질·모델은 확인하세요.<br><br>
<b>Q. 에센셜 오일 넣어도 되나요?</b><br>
A. 제조사 금지 모델 많음. 가열판 막히면 AS 대상 — 설명서 따르기!<br><br>
<b>Q. 하루 종일 켜두나요?</b><br>
A. SuN은 취침 2~3시간 전 ON, 목표 습도 되면 타이머 OFF. 밤새 풀가동은 전기·과습 주의.
</p>
<p style="{sub}">🏠 우리 집 겨울 습도 — 실제 숫자로 보면</p>
<p style="{body}">
SuN은 <b>습도계</b>를 TV 옆에 두고 봤어요. 난방 풀가동이면 25%까지 떨어지더라고요.<br>
가열식 켜고 1시간 — 45% 전후. <b>과습(60%↑)</b>은 창문 5분 환기로 맞춥니다.<br>
아이 방은 <b>40~50%</b> 유지가 코·목 건조와 곰팡이 사이에서 무난했어요.
</p>

<p style="{sub}">💡 SuN의 솔직 한줄평</p>
<p style="{body}">
가열식 가습기는 「<b>세균 걱정 줄이는 선택</b>」으로는 충분히 값어치 있었어요. 대신 전기·소음·관리는 포기 못 합니다.<br>
「완전 무관리」는 없고, 「관리 부담 줄이기」에 가깝다고 보면 기대치 맞추기 좋아요.<br><br>
지금 가습기 뭐 쓰세요? 댓글로 알려주시면 같이 비교해볼게요~ 👋
</p>

<p style="{tags}">{tagline}</p>
""",
    },
    4: {
        "title": "스마트허브로 연동한 가전, 하나 해킹당하면 어떻게 될까? — 대응법까지",
        "slug": "스마트허브_해킹_대응",
        "images": [
            {"file": "blog_smarthub_01_home.png", "alt": "스마트홈 거실", "prompt": "Korean apartment living room smart speaker hub lights robot vacuum, evening ambient", "shot": "hero"},
            {"file": "blog_smarthub_02_security.png", "alt": "보안 설정", "prompt": "smartphone smart home app device list and security toggle, close-up hands on sofa", "shot": "use"},
            {"file": "blog_smarthub_03_network.png", "alt": "공유기", "prompt": "wifi router and mesh node on desk with ethernet cables, home office setup", "shot": "detail"},
            {"file": "blog_smarthub_04_camera.png", "alt": "카메라 해킹", "prompt": "doorbell camera and smart lock on apartment entrance, subtle security concern mood", "shot": "lifestyle"},
            {"file": "blog_smarthub_05_guest_wifi.png", "alt": "게스트 Wi-Fi", "prompt": "laptop showing router guest network settings page, sticky note with password", "shot": "compare"},
            {"file": "blog_smarthub_06_update.png", "alt": "펌웨어 업데이트", "prompt": "IoT devices firmware update notification on phone kitchen counter morning light", "shot": "closing"},
        ],
        "tags": "#스마트허브 #스마트홈 #IoT #해킹 #보안 #가전덕후 #SuN #홈자동화 #개인정보 #Matter #ThinQ",
        "must_include": {"require_solution_steps": True},
        "html": """
<p style="{body}">
안녕하세요~가전덕후 SuN 입니다 😊<br><br>
조명·에어컨·로봇청소기·도어락까지 <b>스마트허브 하나로 연동</b>해 두면 진짜 편해요. 저도 「나갈게」 한마디에 불 끄는 게 익숙해졌거든요 ㅋㅋ<br>
근데 뉴스에서 IoT 해킹 얘기 나올 때마다 — <b>「그중 한 대만 뚫리면 우리 집 전체?」</b> 불안해지더라고요.<br>
오늘은 <b>실제로 어떤 일이 생길 수 있는지</b>, 그리고 <b>집에서 할 수 있는 예방·대응</b>까지 SuN 기준으로 길게 정리해볼게요!
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_smarthub_01_home.png" alt="스마트홈" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">🏠 스마트허브 연동 — 왜 편한데 위험할까?</p>
<p style="{body}">
스마트허브(SmartThings, ThinQ, Google Home, Apple Home, 샤오미 등)는 여러 기기를 <b>한 앱·한 음성</b>으로 묶어줍니다.<br>
문제는 — 기기들이 <b>같은 Wi-Fi·같은 계정·같은 내부망</b>을 공유한다는 점이에요.<br><br>
<b>한 대가 뚫리면 생길 수 있는 일</b><br>
• 연동된 <b>다른 기기 제어</b> 시도 — 문·조명·카메라<br>
• <b>내부망 확산</b> — 약한 공유기 비번이면 PC·NAS까지<br>
• <b>계정 탈취</b> — 앱 전체 장악<br>
• <b>생활 패턴·영상</b> 유출 — CCTV·도어락 로그<br><br>
영화처럼 「로봇청소기가 스파이」는 드물지만, <b>기본 비밀번호·구형 펌웨어</b>에서 실제 사례가 나옵니다. SuN도 예전에 이름 모를 기기가 앱에 떠 있어서 바로 삭제한 적 있어요.
</p>

<p style="{sub}">🚨 해킹 의심될 때 — 해결 Step 1~6</p>
<div style="{box}">
<b style="color:#E8837A;">Step 1. 해당 기기 즉시 오프라인</b><br>
전원 OFF 또는 Wi-Fi 해제. 허브 앱에서 <b>삭제·비활성화</b><br><br>
<b style="color:#E8837A;">Step 2. 계정 비밀번호 전부 변경</b><br>
스마art홈 앱·이메일·공유기 관리자 PW. 다른 사이트와 <b>같은 비번 금지</b><br><br>
<b style="color:#E8837A;">Step 3. 2단계 인증(2FA) 켜기</b><br>
Google·Apple·삼성·LG 계정 모두 — 5분 투자 대비 효과 큼<br><br>
<b style="color:#E8837A;">Step 4. 펌웨어·앱 업데이트</b><br>
패치가 보안 구멍을 메우는 경우 많음. 오래된 IP카메라·저가 IoT가 특히 취약<br><br>
<b style="color:#E8837A;">Step 5. 게스트·IoT 전용 Wi-Fi 분리</b><br>
PC·폰과 가전 네트워크 분리. 공유기가 지원하면 SSID 따로<br><br>
<b style="color:#E8837A;">Step 6. 이상 로그 기록·고객센터</b><br>
「모르는 제어」·「새벽 알림」 스크린샷 남기기
</div>

<p style="text-align:center; margin:24px 0;">
<img src="blog_smarthub_02_security.png" alt="보안 설정" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">🛡️ SuN이 미리 해두는 예방 습관</p>
<p style="{body}">
✅ <b>출고 기본 비번 변경</b> — admin/1234 그대로 두지 않기<br>
✅ <b>UPnP·포트포워딩</b> — 안 쓰면 OFF<br>
✅ <b>브랜드·업데이트 정책</b> — 단종·펌웨어 중단 기기 주의<br>
✅ <b>Matter·Thread</b> — 표준 보안·호환 개선 중. 새로 살 땐 표시 확인<br>
✅ <b>정기 점검</b> — 「최근 로그인 기기」·이름 모르는 기기 삭제<br>
✅ <b>카메라·마이크</b> — 안 쓰는 기기는 전원·렌즈 가리기<br><br>
저가 해외 직구 IoT는 가격은 싸도 <b>보안·AS</b>가 약할 수 있어요. 현관·카메라는 SuN이 특히 신뢰 브랜드 추천합니다.
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_smarthub_03_network.png" alt="공유기" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">📹 특히 조심할 기기 — 카메라·도어락·허브</p>
<p style="{body}">
<b>IP카메라</b> — 기본 포트·비번 그대로인 경우 해킹 검색에 노출된 적 있음<br>
<b>스마art 도어락</b> — 원격 문 열림 기능 + 계정 보안 = 같이 봐야 함<br>
<b>스마트 허브 본체</b> — 뚫리면 연동 전체가 위험<br><br>
「편해서」 원격 개방·음성 구매·자동화를 많이 켜두면, 사고 때 피해 범위도 커집니다. <b>필요한 자동화만</b> 남기는 게 SuN식 미니멀 보안이에요.
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_smarthub_04_camera.png" alt="카메라" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">⚖️ 장점과 한계 — 스마트홈 포기할 필요는 없어요</p>
<p style="{body}">
<b>장점</b> — 분리·2FA·업데이트만 해도 위험 크게 ↓. 편의는 그대로 유지<br>
<b>한계</b> — 100% 해킹 불가능은 아님. 제로데이·피싱은 별개<br>
<b>주의</b> — 「보안 무시하고 편의만」 vs 「무서워서 전부 OFF」 — 둘 다 극단. 중간이 답<br><br>
<b>SuN 팁</b> — 새 기기 살 때마다 <b>5분 보안 체크</b> 루틴: 비번·2FA·게스트 Wi-Fi·펌웨어
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_smarthub_05_guest_wifi.png" alt="게스트 Wi-Fi" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">❓ 자주 묻는 질문</p>
<p style="{body}">
<b>Q. 허브 브랜드 하나로 통일해야 안전한가요?</b><br>
A. 필수는 아니지만, Matter 지원 기기면 브랜드 섞어도 관리는 수월해지는 편.<br><br>
<b>Q. Wi-Fi 끄면 해킹 안 당하나요?</b><br>
A. 오프라인 기능만 쓰면 원격 해킹은 줄지만, 로컬·물리 접근·구형 BLE 취약점은 별개.<br><br>
<b>Q. 스마트홈 포기하고 전부 일반 가전?</b><br>
A. SuN은 NO. 습관만 잡으면 편의 대비 리스크 관리 가능해요.
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_smarthub_06_update.png" alt="업데이트" style="max-width:100%; border-radius:12px;" />
</p>


<p style="{sub}">📋 보안 점검표 — 10분 루틴</p>
<p style="{body}">
월 1회 SuN이 하는 체크예요.<br>
□ 공유기 펌웨어·관리자 PW<br>
□ 스마트홈 앱 「연결 기기」 목록<br>
□ 카메라·도어락 원격 열림 권한<br>
□ 게스트 Wi-Fi 비번<br>
□ 안 쓰는 IoT 전원·삭제<br><br>
한번 해두면 「혹시…」 불안이 줄어요. 스마트홈은 <b>설치가 끝이 아니라 점검</b>이 이어지는 시스템이에요.
</p>


<p style="{sub}">💡 SuN의 솔직 한줄평</p>
<p style="{body}">
스마트허브 연동은 <b>「한 대 뚫리면 집 전체」</b>라는 생각만 하면, 분리·업데이트·2FA가 습관이 됩니다 🛡️<br>
오늘 앱 열어서 <b>연동 기기 목록</b> 한번 훑어보세요. 이름 모르는 기기 있으면 바로 삭제!<br><br>
집에 스마트허브 뭐 쓰세요? 댓글로 알려주시면 브랜드별 보안 팁도 이어서 써볼게요~ 👋
</p>

<p style="{tags}">{tagline}</p>
""",
    },
}
