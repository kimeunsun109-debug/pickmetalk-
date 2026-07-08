"""POSTS_DB 템플릿 — 아이디어 7~14"""

POSTS_DB_7_14: dict[int, dict] = {
    7: {
        "title": "아파트 환풍기에서 담배냄새 역류할 때 — 원인·해결·이웃 대화까지 SuN 정리",
        "slug": "아파트_환풍기_담배냄새_해결",
        "images": [
            {"file": "blog_vent_01_bathroom.png", "alt": "욕실 환풍기", "prompt": "Korean apartment bathroom ceiling exhaust fan grille, yellowed tiles, steam on mirror, morning window light from frosted glass", "shot": "hero"},
            {"file": "blog_vent_02_smoke.png", "alt": "창문 환기", "prompt": "person holding apartment window slightly open at night, city lights outside, tired expression, handheld photo angle", "shot": "lifestyle"},
            {"file": "blog_vent_03_tape.png", "alt": "틈새 밀폐", "prompt": "close-up hands applying silicone sealant around bathroom vent cover edge, step stool legs visible", "shot": "detail"},
            {"file": "blog_vent_04_purifier.png", "alt": "현관 공청기", "prompt": "medium air purifier on floor near apartment entrance hallway, shoes rack, soft evening indoor light", "shot": "use"},
            {"file": "blog_vent_05_duct.png", "alt": "환풍기 분해 청소", "prompt": "bathroom exhaust fan cover removed on towel showing dust buildup, cleaning brush and spray bottle nearby", "shot": "compare"},
            {"file": "blog_vent_06_manager.png", "alt": "관리실 안내", "prompt": "Korean apartment bulletin board with maintenance notice, intercom phone on wall, corridor perspective", "shot": "closing"},
        ],
        "tags": "#아파트생활 #환풍기 #담배냄새 #층간소음 #공기청정기 #가전덕후 #SuN #생활팁 #환기 #실내공기 #역류방지",
        "must_include": {"require_solution_steps": True, "min_list_items": 3},
        "html": """
<p style="{body}">
안녕하세요~가전덕후 SuN 입니다 😊<br><br>
욕실에서 환풍기만 돌리고 있었는데, 문틈으로 <b>담배 냄새</b>가 스며드는 날이 있었어요. 새벽에 깨서 「환풍기 맞아? 창문?」 헷갈린 적, 한 번은 있으시죠 ㅠㅠ<br>
저도 처음엔 옆집 탓만 했는데, 알고 보니 <b>공용 환기 덕트 역류</b>랑 <b>우리 집 환풍구 밀폐</b> 문제가 겹친 경우더라고요.<br>
오늘은 <b>왜 생기는지</b>, <b>집에서 순서대로 해볼 것</b>, <b>이웃·관리실 대화 팁</b>까지 — SuN이 겪어본 기준으로 길게 정리해볼게요!
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_vent_01_bathroom.png" alt="욕실 환풍기" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">😫 환풍기인데 담배냄새? — 구조부터 이해하면 덜 당활해요</p>
<p style="{body}">
아파트 환기는 대략 <b>우리 집 환풍기 → 공용 덕트 → 옥상/외벽 배출</b> 흐름이에요. 바람은 밖으로 나가야 정상인데, 현실은 이렇습니다.<br><br>
• <b>덕트 역풍</b> — 다른 세대·바람·배기 동시 사용 시 공기가 거꾸로 밀림<br>
• <b>역류방지 밸브 노후</b> — 15~20년 아파트에서 특히 흔함<br>
• <b>환풍구 주변 틈</b> — 커버만 닫혀 있고 실리콘이 뜬 경우<br>
• <b>흡연 시간대 + 환기 겹침</b> — 밤 10시~새벽에 체감이 확 커짐<br><br>
「우리 집만 이상한가」 싶었는데, 입주 1년 차에 관리실에 물어보니 <b>덕트 청소 이력</b>이 오래된 건물이더라고요. 이웃 문제만은 아닌 날이 많습니다.
</p>

<p style="{sub}">🔍 역류인지 확인하는 SuN 체크 (10분)</p>
<p style="{body}">
1️⃣ <b>냄새가 환풍기 ON일 때만</b> 심해지나요? → 역류 가능성 ↑<br>
2️⃣ <b>욕실·주방 중 어디서</b> 더 세나요? → 덕트 분기 단서<br>
3️⃣ <b>환풍기 커버 내려서</b> 먼지·기름 때 — 막혀 있으면 효율↓ 역류↑<br>
4️⃣ <b>창문만 열었을 때</b>도 냄새가 오나요? → 문틈·복도 유입도 의심<br>
5️⃣ <b>비슷한 층 이웃</b>에게 조심스레 여쭤보기 — 혼자만 그런지 감 잡기<br><br>
저는 3번에서 커버 뒤 <b>실리콘 틈</b>이 뜬 걸 발견했을 때 「아, 이거부터」 싶었어요.
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_vent_02_smoke.png" alt="창문 환기" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">🔧 해결 Step 1~6 — 비용 적은 순서로</p>
<div style="{box}">
<b style="color:#E8837A;">Step 1. 환풍기·환풍구 청소</b><br>
커버 분리 → 먼지 제거 → 배수구 주변도 확인. 막히면 역류 체감이 커집니다.<br><br>
<b style="color:#E8837A;">Step 2. 틈새 밀폐</b><br>
커버 테두리 <b>실리콘·틈새테이프</b>. 30분 작업인데 체감 꽤 있었어요.<br><br>
<b style="color:#E8837A;">Step 3. 역류방지 환풍기 교체 검토</b><br>
<b>역류방지 캡·밸브</b> 있는 모델. 덕트 규격(직경) 먼저 재기!<br><br>
<b style="color:#E8837A;">Step 4. 환기 습관 바꾸기</b><br>
밤늦게 환풍기·창문 <b>동시에 오래</b> X. 5~10분 환기 후 환풍기만.<br><br>
<b style="color:#E8837A;">Step 5. 공기청정기·활성탄</b><br>
<b>현관·복도</b> 쪽 중형 공청기. 필터 교체 주기 잊지 마세요.<br><br>
<b style="color:#E8837A;">Step 6. 관리실에 공용 덕트 점검 요청</b><br>
개별 조치 후에도 같으면 <b>공용부 청소·밸브</b>가 근본인 경우 많아요.
</div>

<p style="text-align:center; margin:24px 0;">
<img src="blog_vent_03_tape.png" alt="틈새 밀폐" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">🛒 제품·비용 — SuN이 추천하는 순서</p>
<p style="{body}">
<b>0단계 (0~3만 원)</b> — 청소·밀폐·환기 시간 조절. 여기서 30%는 끝납니다.<br>
<b>1단계 (5~15만 원)</b> — 욕실·주방 <b>역류방지 환풍기</b> 각각. 저는 욕실부터 바꿨어요.<br>
<b>2단계 (10~30만 원)</b> — <b>HEPA+탈취</b> 공청기. 「냄새는 줄는데 역류는 그대로」일 때 보조.<br>
<b>3단계 (업체 점검)</b> — 덕트 내시경·밸브 교체. 아파트 단위로 요청하면 비용 분담도 가능.<br><br>
<b>주의</b> — 향 캔들·강한 방향제만 뿌리면 <b>곰팡이·머리 아픔</b>만 늘 수 있어요. 환기 설비부터가 맞습니다.
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_vent_04_purifier.png" alt="공기청정기" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">🗣️ 이웃·관리실 — 감정 싸움 전에 쓰는 말</p>
<p style="{body}">
SuN은 「담배 냄새 때문에」 바로 찾아가기보다, <b>기록 → 관리실 → 조심스러운 대화</b> 순서를 추천해요.<br><br>
• <b>날짜·시간·어느 방</b>에서 냄새 났는지 메모 (사진·영상은 프라이버시 주의)<br>
• 관리실: 「<b>공용 환기 덕트 점검</b> 가능한가요?」 — 개인 갈등보다 설비 문제로 접근<br>
• 이웃 대화: 「환기 때문에 역류가 있는 것 같아서요」 — 탓하기보다 <b>공동 해결</b> 톤<br><br>
관리규약에 <b>발코니·실내 흡연</b> 관련 조항 있는지도 확인하세요. 법적 해석은 사안마다 달라서, 필요하면 <b>관할 기관 상담</b>이 안전합니다.
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_vent_05_duct.png" alt="환풍기 청소" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">⚖️ 장점·단점·실수하기 쉬운 점</p>
<p style="{body}">
<b>장점</b> — 비교적 저렴하게 체감 개선, 기술적 조치 후 대화하면 이웃 관계도 덜 예민해짐<br>
<b>단점</b> — 건물 전체 덕트 문제면 100% 차단은 어려움, 새 환풍기만으로 만능은 아님<br>
<b>자주 하는 실수</b><br>
❌ 환풍기 <b>완전 차단</b> → 곰팡이·결로·새 냄새<br>
❌ 공청기만 사고 <b>덕트·틈새 방치</b><br>
❌ 밤새 창문+환풍기 풀가동 → 역류·소음·난방 낭비<br><br>
<b>SuN 팁</b> — 겨울엔 <b>짧게 자주</b> 환기, 여름엔 <b>역류 심한 시간대</b>만 피하는 것도 도움 됩니다.
</p>

<p style="{sub}">❓ 자주 묻는 질문</p>
<p style="{body}">
<b>Q. 환풍기 끄면 냄새가 안 들어오나요?</b><br>
A. 단기적으로는 줄 수 있지만, 습기 때문에 <b>장기적으로 비추</b>예요.<br><br>
<b>Q. 새 아파트면 괜찮을까요?</b><br>
A. 설계는 나아도 <b>밸브 품질·사용 습관</b>에 따라 비슷한 일이 생깁니다.<br><br>
<b>Q. 공기청정기만 사면 끝인가요?</b><br>
A. <b>보조</b>로는 좋지만 역류 자체를 막지는 못해요. 환풍기·덕트 조치와 병행!<br><br>
<b>Q. 주방 환풍기도 같이 봐야 하나요?</b><br>
A. 네. 욕실만 해결해도 <b>주방 덕트</b>에서 냄새가 오는 경우 많아요.
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_vent_06_manager.png" alt="관리실" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">💡 SuN의 솔직 한줄평</p>
<p style="{body}">
담배냄새 역류는 「이웃 문제」처럼 보여도, 반은 <b>환기 설비·밀폐·습관</b> 문제예요. 집에서 할 수 있는 건 생각보다 많습니다.<br>
오늘 욕실 환풍기 커버만 내려서 <b>먼지·틈새</b> 확인해 보세요. 다음 행동이 바로 정해질 거예요. 작은 점검 하나가 생활 만족도를 꽤 바꿉니다.<br><br>
비슷한 경험 있으신가요? 아파트 연식·해결법 댓글로 알려주시면 모아서 다음 글도 써볼게요~ 👋
</p>

<p style="{tags}">{tagline}</p>
""",
    },
    8: {
        "title": "데이터를 사막에 묻는다고? — 오프라인 저장이 현실이 되려면",
        "slug": "데이터_사막_저장_미래",
        "images": [
            {"file": "blog_desert_01_server.png", "alt": "서버실", "prompt": "rows of server racks in cool data center aisle, blue ambient light, realistic photo", "shot": "hero"},
            {"file": "blog_desert_02_tape.png", "alt": "테이프 보관", "prompt": "magnetic tape data cartridges on shelf in archive room, close-up labels", "shot": "detail"},
            {"file": "blog_desert_03_desert.png", "alt": "사막", "prompt": "vast dry desert landscape with distant mountains, harsh sunlight, documentary photo", "shot": "lifestyle"},
            {"file": "blog_desert_04_bunker.png", "alt": "지하 저장", "prompt": "underground concrete bunker corridor with storage crates, dim emergency lighting", "shot": "compare"},
            {"file": "blog_desert_05_article.png", "alt": "기사 읽기", "prompt": "person reading tech news on tablet at home desk, coffee, evening lamp", "shot": "use"},
            {"file": "blog_desert_06_future.png", "alt": "미래 저장", "prompt": "futuristic holographic data archive concept in modest home office, subtle not sci-fi", "shot": "closing"},
        ],
        "tags": "#데이터센터 #오프라인저장 #디지털아카이브 #테이프백업 #IT상식 #가전덕후 #SuN #클라우드 #장기보관 #테크트렌드",
        "must_include": {"must_keywords": ["언제"]},
        "html": """
<p style="{body}">
안녕하세요~오늘의 핫한 IT이야기를 알려드리러 온 SuN 입니다 🔥<br><br>
가끔 기사에서 「데이터를 사막 지하에 묻는다」「핵폐기물 저장고처럼 보관한다」는 말을 보죠.<br>
처음엔 농담인 줄 알았는데, 알고 보니 <b>장기 디지털 보관</b>을 진지하게 연구하는 흐름이더라고요 ㅋㅋ<br>
오늘은 <b>왜 사막 얘기가 나오는지</b>, 그리고 <b>언제쯤 현실이 될 수 있는지</b> 쉽게 풀어볼게요!
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_desert_01_server.png" alt="데이터센터" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">🏜️ 「사막에 묻는다」는 말의 진짜 의미</p>
<p style="{body}">
클라우드에 올린 사진·영상도 결국 <b>어딘가 물리 디스크</b>에 있습니다.<br>
문제는 — 디스크는 <b>10~20년</b> 지나면 교체·마이그레이션이 필요하고, 전력·냉각 비용도 계속 듭니다.<br><br>
그래서 연구자들은 <b>전력 적게, 오래, 안전하게</b> 두려고 이런 조건을 봐요.<br>
• 건조하고 서늘한 환경 (습기·부식↓)<br>
• 지진·홍수 위험 낮음<br>
• 정치적으로 안정적인 지역<br>
• 지하 심층 — 온도 변화 적음<br><br>
<b>사막 + 지하</b> 조합이 자주 나오는 이유가 이거예요. SF가 아니라 <b>장기 보관 물리학</b>에 가깝습니다.<br><br>
국내에서도 「장기 디지털 보관」 니즈는 커지고 있어요. 방송사 아카이브, 공공기관 기록, 기업 감사 로그처럼 <b>10년 이상 안 열어도 되는 데이터</b>가 많거든요. 이런 데이터는 빠른 접속보다 <b>안전·저전력·장수명</b>이 더 중요합니다.
</p>

<p style="{sub}">💾 지금 쓰는 방법 vs 미래 후보</p>
<div style="{box}">
<b style="color:#E8837A;">현재 주류</b><br>
• HDD/SSD 데이터센터 — 접근 빠름, 전력·비용 큼<br>
• <b>LTO 테이프</b> — 대용량 아카이브에 아직 강자 (방치 보관에 유리)<br>
• 블루레이·M-DISC 같은 장수 광디스크 — 소량 장기 보관<br><br>
<b style="color:#E8837A;">연구 중</b><br>
• DNA·합성 폴리머 저장 — 극장기 but 상용화 멀음<br>
• 지하 암반 저장고 — 핵폐기물 저장 기술 응용 얘기<br>
• 극저전력 「친자성」 아카이브 — 읽을 때만 전력
</div>

<p style="text-align:center; margin:24px 0;">
<img src="blog_desert_02_tape.png" alt="테이프" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">⏳ 언제쯤 현실이 될까? — 솔직한 타임라인</p>
<p style="{body}">
<b>이미 현실인 부분 (2020년대)</b><br>
✅ 테이프·지하 시설 아카이브 — 정부·대기업·방송사는 씁니다<br>
✅ 북유럽·미국 일부 <b>지하 데이터 벙커</b> 상업 운영 중<br><br>
<b>10년 내 (2030년대 전후)</b><br>
🔶 극저전력 오프라인 아카이브 상용화 가능성 — <b>빅테크·연구기관</b>부터<br>
🔶 일반인 「디지털 유산」 보관 서비스로 일부 판매될 수도<br><br>
<b>아직 먼 것</b><br>
❌ DNA 저장 대중화, 사막 전역에 묻는 식의 표준 인프라<br><br>
저는 「언제」의 답을 <b>「부분적으로는 지금, 전면적으로는 15년+」</b> 정도로 봅니다.<br><br>
<b>국내 맥락</b>에서도 공공기관·금융권은 장기 보관 규정이 엄격해요. 「5년 지나면 삭제」가 원칙인데, 실제로는 백업·테이프·클라우드가 겹쳐 있어서 관리가 복잡합니다. 사막 저장 얘기는 이런 <b>장기 보관 스트레스</b>를 풀려는 상상이라고 보면 이해가 빨라요.
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_desert_03_desert.png" alt="사막" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">⚖️ 장점과 단점</p>
<p style="{body}">
<b>장점</b> — 장기 보존 비용↓, 해킹 표면↓(오프라인), 재난 복원력<br>
<b>단점</b> — <b>즉시 접근 불가</b>, 복원 시간·비용, 기술 세대 교체 시 호환성<br>
<b>주의</b> — 「묻으면 영원」 아님. <b>포맷·리더기</b>도 같이 보관해야 합니다.<br><br>
개인에게는 사막이 아니어도 <b>외장 HDD 두 개를 번갈아</b> 보관하는 방식만으로도 장기 안정성이 꽤 올라갑니다.
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_desert_04_bunker.png" alt="지하" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">🏠 일반인에게 의미는?</p>
<p style="{body}">
당장 사막에 보낼 일은 없지만, 습관은 비슷해요.<br>
• 중요 파일은 <b>3-2-1 백업</b> (원본 1 + 로컬 2 + 외부 1)<br>
• 오래 안 볼 사진·영상은 <b>외장 HDD + 테이프/클라우드 콜드</b> 분리<br>
• 5년마다 <b>마이그레이션</b> — 안 하면 USB도 안 열림… 경험하신 분?<br><br>
직접 사용하면서 느낀 건, 「저장」보다 <b>「꺼내 읽기」</b>가 더 어렵다는 거예요.<br><br>
예를 들어 10년 전 USB에 담은 웨딩 영상 — 컴퓨터 포트도 바뀌고 파일 포맷도 옛날 것이라 재생이 안 될 때가 있죠. 사막 저장도 똑같아요. <b>데이터 + 읽는 장치 + 소프트웨어</b> 세트로 관리해야 진짜 「보관」이 됩니다.
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_desert_05_article.png" alt="뉴스" style="max-width:100%; border-radius:12px;" />
</p>


<p style="{sub}">📌 SuN 추가 메모 — 읽고 나서 해볼 것</p>
<p style="{body}">
이 주제는 뉴스랑 실생활이 같이 움직여요. 글만 읽고 끝내기보다 <b>오늘 하나</b>만 해보면 체감이 달라집니다.<br>
• 관련 키워드로 네이버·유튜브 <b>최근 3개월</b> 자료만 훑기<br>
• 우리 집·우리 상황에 맞는지 「그대로 따라 하기」 전에 한번 걸러 보기<br>
• 비슷한 고민 댓글 달아 주시면 SuN이 모아서 다음 글로 이어갈게요<br><br>
궁금한 점 있으면 댓글로 남겨 주세요. 같이 정보 보태면 글이 더 단단해집니다 👍
</p>


<p style="{body}">
<b>SuN 한마디 더</b> — 글에서 정리한 내용은 「정답」이라기보다 <b>우리 집 기준 참고</b>예요. 제품·정책·법규는 바뀔 수 있으니, 구매·설정 전에는 공식 안내도 한번 더 확인해 주세요. 비슷한 경험 있으시면 댓글로 공유해 주시면 다음 글에 반영할게요 😊
</p>

<p style="{sub}">💡 SuN의 솔직 한줄평</p>
<p style="{body}">
데이터 사막 저장은 <b>과장된 헤드라인 + 진짜 연구</b>가 섞여 있어요.<br>
완전 대중화는 멀지만, 「전기 안 먹는 창고」 쪽은 이미 시작됐습니다. 개인도 클라우드 사진을 10년 쌓아두면 결국 <b>아카이브 비용</b>을 생각하게 되거든요.<br><br>
여러분은 오래된 사진 어디에 백업해 두세요? 댓글로 꿀팁 공유해 주세요~ 👋 (테이프·외장HDD·클라우드 조합도 환영!)
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_desert_06_future.png" alt="미래" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{tags}">{tagline}</p>
""",
    },
    9: {
        "title": "10원짜리 알뜰폰 요금제? — 이렇게 가능한 이유와 선택 팁",
        "slug": "알뜰폰_10원_요금제",
        "images": [
            {"file": "blog_mvno_01_phone.png", "alt": "스마트폰 요금제", "prompt": "smartphone showing mobile plan comparison screen on couch, casual home", "shot": "hero"},
            {"file": "blog_mvno_02_sim.png", "alt": "유심 교체", "prompt": "hands inserting SIM card into smartphone with MVNO leaflet on table", "shot": "use"},
            {"file": "blog_mvno_03_chart.png", "alt": "요금 비교", "prompt": "notebook with handwritten mobile plan cost comparison, pen, calculator", "shot": "compare"},
            {"file": "blog_mvno_04_tower.png", "alt": "통신망", "prompt": "cell tower and apartment buildings in Korean city suburb, overcast sky", "shot": "lifestyle"},
            {"file": "blog_mvno_05_store.png", "alt": "편의점 유심", "prompt": "convenience store shelf with prepaid SIM packages, shopper hand reaching", "shot": "detail"},
            {"file": "blog_mvno_06_bill.png", "alt": "청구서", "prompt": "person relieved looking at low phone bill on laptop at kitchen table", "shot": "closing"},
        ],
        "tags": "#알뜰폰 #MVNO #요금제 #10원 #통신비절약 #가전덕후 #SuN #LTE #데이터 #스마트폰",
        "must_include": {"must_keywords": ["가능"], "post_type": "howto"},
        "html": """
<p style="{body}">
안녕하세요~가전덕후 SuN 입니다 😊<br><br>
광고 보다 보면 「월 10원 요금제」 같은 문구 한번쯤 보셨죠? 솔직히 처음엔 사기 아닌가 싶었어요 ㅋㅋ<br>
근데 구조를 알고 나니 <b>어떻게 가능한지</b>는 이해되더라고요. 다만 <b>누구에게 맞는지</b>는 또 다른 이야기!<br>
오늘은 10원 알뜰폰 요금제의 <b>원리·장단점·가입 전 체크</b>까지 정리해볼게요.
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_mvno_01_phone.png" alt="요금제" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">📱 알뜰폰(MVNO)이 뭐야?</p>
<p style="{body}">
<b>MVNO</b>는 SKT·KT·LG유플러스 망을 <b>도매로 빌려</b> 파는 통신사예요.<br>
자기 기지국 없이 망만 임대하니 <b>마케팅·매장 비용</b>이 줄고, 그 차액을 요금 할인으로 돌려줍니다.<br><br>
「10원」은 보통 <b>프로모션·선택 약정·제휴 카드</b>가 합쳐진 <b>체감가</b>인 경우가 많아요. 표면 월정액만 10원은 거의 없고, <b>조건부 최종 금액</b>을 꼭 봐야 합니다.
</p>

<p style="{sub}">💰 10원이 가능한 이유 — 4가지 구조</p>
<div style="{box}">
<b style="color:#E8837A;">1) 망 임대 도매 할인</b> — 기존 3사 대비 낮은 단가<br>
<b style="color:#E8837A;">2) 데이터·통화 최소 플랜</b> — 거의 안 쓰는 사용자 대상<br>
<b style="color:#E8837A;">3) 가입·유지 기간 프로모션</b> — 6~24개월 후 요금 인상<br>
<b style="color:#E8837A;">4) 제휴·멤버십·카드 리베이트</b> — 청구 할인으로 「10원」 체감
</div>

<p style="text-align:center; margin:24px 0;">
<img src="blog_mvno_02_sim.png" alt="유심" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">✅ 누구에게 잘 맞을까?</p>
<p style="{body}">
• <b>와이파이 위주</b> — 집·회사·카페만 쓰는 분<br>
• <b>유심만 데이터 조금</b> — 내비·카톡 정도<br>
• <b>두 번째 번호</b> — 업무·인증용 보조 회선<br>
• <b>어르신 폰</b> — 통화 위주, 스마트폰 가끔<br><br>
반대로 <b>영상·게임·핫스팟 많이</b> 쓰면 10원 플랜은 금방 한도 터져요. 저도 테스트로 써봤다가 중간에 업그레이드했습니다 😅<br><br>
<b>데이터 사용량</b>은 스마트폰 설정에서 「지난 30일」 통계를 보면 바로 나와요. 이 숫자 없이 요금제 고르면 거의 실패합니다!
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_mvno_03_chart.png" alt="비교" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">⚖️ 장점과 단점</p>
<p style="{body}">
<b>장점</b> — 통신비 절감, 약정 유연, 온라인 개통 편함<br>
<b>단점</b> — 혼잡 시간 <b>속도 저하</b>, 고객센터 품질 편차, 프로모션 끝나면 <b>요금 인상</b><br>
<b>주의</b> — 「평생 10원」 문구는 거의 없음. <b>24개월 후 금액</b> 반드시 확인!
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_mvno_04_tower.png" alt="통신망" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">🛒 가입 전 체크리스트</p>
<p style="{body}">
1️⃣ <b>어떤 망(MNO)</b> 빌리는지 — 우리 동네 품질 확인<br>
2️⃣ <b>데이터·통화·문자</b> 기본 제공량<br>
3️⃣ <b>프로모션 종료 후</b> 월 요금<br>
4️⃣ <b>번호이동·기기 할부</b> 잔여 여부<br>
5️⃣ <b>해지 위약금·유심 비용</b><br><br>
SuN 팁 — 요금제 비교 사이트에서 <b>24개월 총 비용</b>으로 보는 게 제일 정확해요.
</p>

<p style="{sub}">📝 가입 Step 1~4 — 처음 해봤을 때 순서</p>
<p style="{body}">
<b>Step 1.</b> 통신 품질 지도에서 우리 동네 <b>망별 속도</b> 확인<br>
<b>Step 2.</b> 쓰는 데이터·통화량 3개월 평균 내기 (과소하면 요금 폭탄)<br>
<b>Step 3.</b> 온라인 개통 — 유심 배송 or 편의점 바로 개통<br>
<b>Step 4.</b> 첫 달 청구서 확인 후 <b>프로모션·부가요금</b> 체크<br><br>
저도 처음 알뜰폰 쓸 때 이 순서로 했는데, 생각보다 30분이면 끝났어요. 다만 번호이동은 기존 통신사 해지 타이밍만 조심하세요!
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_mvno_05_store.png" alt="유심" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">❓ 자주 묻는 질문</p>
<p style="{body}">
<b>Q. 통화 품질 떨어지나요?</b><br>
A. 같은 망이면 큰 차이 없는 편. 다만 고객센터·로밍·부가서비스는 MVNO마다 다름.<br><br>
<b>Q. 5G도 10원?</b><br>
A. 드뭅니다. LTE 저가 플랜이 대부분.<br><br>
<b>Q. 약정 없이 가능?</b><br>
A. 많아요. 대신 단말 할인은 적은 편.<br><br>
<b>Q. 번호이동 위약금은?</b><br>
A. 기존 통신사 약정 잔여 확인 필수. 알뜰폰 가입 전에 <b>해지 비용</b> 계산부터 하세요.
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_mvno_06_bill.png" alt="청구서" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">📊 알뜰폰 vs 3사 — 요금 비교할 때</p>
<p style="{body}">
같은 5GB라도 <b>망 임대료·부가서비스</b> 때문에 체감가가 달라요.<br>
3사는 단말 할인·결합할인이 강하고, 알뜰폰은 <b>월정액</b>이 낮은 경우가 많습니다.<br>
저는 「유심만 오래 쓰는 타입」이면 알뜰폰이 유리했어요. 인터넷+TV 결합 중이면 다시 계산해보세요!
</p>


<p style="{sub}">📌 SuN 추가 메모 — 읽고 나서 해볼 것</p>
<p style="{body}">
이 주제는 뉴스랑 실생활이 같이 움직여요. 글만 읽고 끝내기보다 <b>오늘 하나</b>만 해보면 체감이 달라집니다.<br>
• 관련 키워드로 네이버·유튜브 <b>최근 3개월</b> 자료만 훑기<br>
• 우리 집·우리 상황에 맞는지 「그대로 따라 하기」 전에 한번 걸러 보기<br>
• 비슷한 고민 댓글 달아 주시면 SuN이 모아서 다음 글로 이어갈게요<br><br>
궁금한 점 있으면 댓글로 남겨 주세요. 같이 정보 보태면 글이 더 단단해집니다 👍
</p>


<p style="{body}">
<b>SuN 한마디 더</b> — 글에서 정리한 내용은 「정답」이라기보다 <b>우리 집 기준 참고</b>예요. 제품·정책·법규는 바뀔 수 있으니, 구매·설정 전에는 공식 안내도 한번 더 확인해 주세요. 비슷한 경험 있으시면 댓글로 공유해 주시면 다음 글에 반영할게요 😊
</p>

<p style="{sub}">💡 SuN의 솔직 한줄평</p>
<p style="{body}">
10원 요금제는 <b>가능합니다</b> — 다만 「마법」이 아니라 <b>조건 맞춤 할인</b>이에요.<br>
내 사용 패턴이랑 안 맞으면 오히려 돈 더 쓸 수 있으니, <b>한 달 시험</b> 후 정하는 걸 추천합니다. 영상·유튜브를 통신사 데이터 없이 못 보는 분은 거의 무조건 데이터 부족으로 업그레이드하게 돼요.<br><br>
지금 쓰는 요금제 월 얼마인지 댓글로 공유해 주시면 절약 팁도 달아볼게요~ 👋 알뜰폰 써본 경험담 있으면 특히 좋아요!
</p>

<p style="{tags}">{tagline}</p>
""",
    },
    10: {
        "title": "[엉뚱상상] 치매 환자에게 AI칩을 심으면 정상생활이 가능할까?",
        "slug": "치매_AI칩_엉뚱상상",
        "images": [
            {"file": "blog_aichip_01_elder.png", "alt": "어르신 일상", "prompt": "elderly person drinking tea in sunny living room with family photo frames, warm mood", "shot": "hero"},
            {"file": "blog_aichip_02_brain.png", "alt": "뇌과학", "prompt": "medical brain scan images on doctor desk with stylus, realistic clinic not scary", "shot": "detail"},
            {"file": "blog_aichip_03_chip.png", "alt": "칩 상상", "prompt": "tiny microchip on fingertip with magnifying glass, soft lab lighting", "shot": "compare"},
            {"file": "blog_aichip_04_watch.png", "alt": "웨어러블", "prompt": "senior wearing smartwatch with health alert, walking in park, candid", "shot": "use"},
            {"file": "blog_aichip_05_ethics.png", "alt": "윤리 토론", "prompt": "two people discussing ethics at cafe table with notebook, thoughtful mood", "shot": "lifestyle"},
            {"file": "blog_aichip_06_future.png", "alt": "미래 상상", "prompt": "calm futuristic home assistant helping elderly with reminders, subtle not dystopian", "shot": "closing"},
        ],
        "tags": "#엉뚱상상 #치매 #AI칩 #뇌임플란트 #웨어러블 #가전덕후 #SuN #헬스테크 #미래의학 #디지털윤리",
        "html": """
<p style="{body}">
안녕하세요~가전덕후 SuN 입니다 😊 오늘은 <b>[엉뚱상상]</b> 코너!<br><br>
「치매 환자 머리에 AI칩 심으면 — 길 찾기, 이름 기억, 일상 루틴 — 다 도와줘서 <b>정상생활</b> 가능하지 않을까?」<br>
영화·뉴스 보면서 한번쯤 상상해보셨죠 ㅋㅋ 저도 가족 얘기 들으며 진지하게 검색해봤어요. 의학·윤리·가전이 한 번에 엮이는 주제라 길게 정리해봤습니다.<br>
오늘은 <b>과학적으로 어디까지 가능한지</b>, <b>윤리·현실적 대안</b>까지 가볍게 풀어볼게요! 엉뚱하지만 요즘 뉴스랑 연결해서 보면 재밌어요.
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_aichip_01_elder.png" alt="어르신" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">🧠 지금 의학·기술은 어디까지 왔나?</p>
<p style="{body}">
<b>뇌 임플란트(BCI)</b>는 이미 연구·임상 단계에 있어요. 마비 환자 의사소통, 뇌전증 자극 등.<br>
다만 목적이 「기억 복원」보다 <b>신호 읽기·자극 제어</b>에 가깝습니다.<br><br>
<b>AI칩</b>이라고 부를 만한 것들:<br>
• <b>딥브레인 자극(DBS)</b> — 전기 자극으로 증상 완화 (파킨슨 등)<br>
• <b>기억 보조 연구</b> — 해마 자극 실험 (초기 단계)<br>
• <b>웨어러블 + AI</b> — 칩 없이도 일상 보조는 이미 가능<br><br>
「치매를 낫게」보다 <b>「안전·루틴 유지」</b> 쪽이 현실에 가깝다고 봅니다.<br><br>
최근에는 <b>웨어러블 + AI 알림</b> 조합이 병원·요양 분야에서 먼저 시범 사업이 되고 있어요. 칩 이식보다 <b>비침습(안 심는)</b> 쪽이 규제·윤리 면에서 빠르게 퍼질 가능성이 큽니다.
</p>

<p style="{sub}">🤖 AI칩이 해줄 수 있다면? — 상상 시나리오</p>
<div style="{box}">
<b style="color:#E8837A;">길 찾기</b> — GPS + 실내 위치 + 음성 안내<br>
<b style="color:#E8837A;">가족 얼굴·이름</b> — AR 안경에 표시<br>
<b style="color:#E8837A;">약 복용·식사</b> — 시간 알림 + 확인<br>
<b style="color:#E8837A;">이상 행동 감지</b> — 보호자에게 알림<br><br>
이건 칩 없이도 <b>스마트워치·스피커·센서</b>로 상당 부분 가능해요. 저희 할머니 댁에도 스피커 알람 써봤는데 생각보다 도움 됐습니다.<br><br>
의료 AI 뉴스는 <b>데모와 승인</b>을 구분해서 보세요. 영상만 보면 내일 나올 것 같지만, 임상은 보통 훨씬 깁니다.
</div>

<p style="text-align:center; margin:24px 0;">
<img src="blog_aichip_02_brain.png" alt="뇌" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">⚠️ 왜 당장은 어려울까? — 한계와 윤리</p>
<p style="{body}">
<b>기술 한계</b><br>
• 기억은 한 구역이 아니라 <b>전뇌 네트워크</b> — 칩 하나로 복원 어려움<br>
• 수술·감염·거부 반응 리스크<br>
• AI 오류 시 <b>잘못된 기억·행동</b> 유도 가능<br><br>
<b>윤리·법</b><br>
• 동의 능력 없는 분에게 시술?<br>
• 누가 데이터·알고리즘을 통제?<br>
• 「정상」의 정의 — 개인성·자유will 문제<br><br>
솔직히 무서운 부분도 있어요. 영화가 전부 허구는 아닙니다.<br><br>
한편으로는 <b>보조 기술</b> 관점에선 희망도 있어요. 기억을 「대신」해 주기보다, 잊었을 때 <b>안전하게 안내</b>해 주는 쪽이 윤리적으로도 수용 가능성이 높거든요. 연구 방향도 그쪽으로 점점 기울고 있다고 봅니다.
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_aichip_03_chip.png" alt="칩" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">🏠 지금 당장 쓸 수 있는 대안</p>
<p style="{body}">
1️⃣ <b>스마트워치</b> — 낙상·심박·위치 공유<br>
2️⃣ <b>스마트 스피커</b> — 일정·약 알림<br>
3️⃣ <b>현관·가스 센서</b> — 이상 징후 알림<br>
4️⃣ <b>간단 스마트폰</b> — 긴급 호출 버튼<br>
5️⃣ <b>가족 공유 앱</b> — 위치·일정 (동의 하에)<br><br>
칩보다 <b>덜 화려하지만</b> 실제로 가정에서 쓰이는 쪽이에요. 가전덕후로서 이 라인이 더 현실적이라고 봅니다.<br><br>
스마트홈 허브와 연동하면 「밤에 현관문 열림 감지 → 가족에게 알림」 같은 시나리오도 가능해요. AI칩 상상보다 <b>지금 당장 조합</b>하는 게 체감이 빠릅니다.
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_aichip_04_watch.png" alt="워치" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">⚖️ 장점과 단점 (상상 포함)</p>
<p style="{body}">
<b>이상적 장점</b> — 자립성↑, 보호자 부담↓, 사고 예방<br>
<b>현실적 단점</b> — 비용·접근성·윤리·오작동, <b>인간관계·존엄</b> 이슈<br>
<b>SuN 팁</b> — 기술 뉴스 볼 때 「언제」보다 <b>「누구 동의로」</b>를 먼저 보세요.<br><br>
<b>현실 팁</b> — 치매 예방·관리는 기술보다 <b>생활 습관·정기 검진</b>이 우선입니다. AI는 그다음 보조 역할로 보는 게 마음 편해요.
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_aichip_05_ethics.png" alt="윤리" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">❓ 자주 묻는 질문</p>
<p style="{body}">
<b>Q. AI칩 상용화 뉴스, 믿어도 될까요?</b><br>
A. <b>임상 단계·소수 사례</b>와 「모두에게 적용」은 다릅니다. 언론 보도는 낙관적으로 쓰이는 경우도 있어요.<br><br>
<b>Q. 가족이 치매 초기면 뭘 먼저 하죠?</b><br>
A. 병원 진단·치료 계획이 우선. 기술은 <b>안전·일정 알림</b> 같은 보조부터요.<br><br>
<b>Q. 스마트 기기만으로 충분한가요?</b><br>
A. 완벽하진 않지만, <b>낙상·배회</b> 대비에는 도움 됩니다. 사람 돌봄을 대체하진 못해요.
</p>

<p style="{sub}">💡 SuN의 엉뚱상상 한줄평</p>
<p style="{body}">
치매 AI칩으로 <b>완전한 정상생활</b>은 아직 SF에 가깝고, <b>부분 보조</b>는 이미 시작됐어요.<br>
먼 미래보다 — <b>지금 집에 센서·워치·스피커</b>로 할 수 있는 게 더 많습니다. 가족력이 걱정되면 병원 상담과 함께 <b>생활 안전 장치</b>부터 차근차근 준비하는 게 현실적이에요.<br><br>
여러분은 어떤 미래 의료 기술이 가장 궁금하세요? 댓글로 엉뚱상상 편하게 달아주세요~ 👋 (현실적인 웨어러블 후기도 좋아요!) 다음엔 스마트 링·워치 비교도 써볼게요.
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_aichip_06_future.png" alt="미래" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{tags}">{tagline}</p>
""",
    },
    11: {
        "title": "집안일 대신 해주는 주는 로봇, 언제쯤 현실이 될까?",
        "slug": "집안일_주는로봇_시대",
        "images": [
            {"file": "blog_homebot_01_room.png", "alt": "거실", "prompt": "messy living room with laundry basket dishes on table, realistic Korean apartment", "shot": "hero"},
            {"file": "blog_homebot_02_vacuum.png", "alt": "청소로봇", "prompt": "robot vacuum between sofa and table, daily life clutter, natural light", "shot": "use"},
            {"file": "blog_homebot_03_humanoid.png", "alt": "휴머노이드", "prompt": "humanoid robot prototype folding towel in lab, engineers in background, documentary", "shot": "compare"},
            {"file": "blog_homebot_04_kitchen.png", "alt": "주방", "prompt": "person washing dishes while smart dishwasher open, tired evening mood home kitchen", "shot": "lifestyle"},
            {"file": "blog_homebot_05_ces.png", "alt": "전시회", "prompt": "trade show demo of home robot arm picking cup, crowd watching, realistic photo", "shot": "detail"},
            {"file": "blog_homebot_06_dream.png", "alt": "미래 집", "prompt": "calm tidy apartment evening after cleaning, warm lamp no robots visible", "shot": "closing"},
        ],
        "tags": "#주는로봇 #가사로봇 #휴머노이드 #로봇청소기 #스마트홈 #가전덕후 #SuN #CES #미래가전 #생활로봇",
        "must_include": {"must_keywords": ["언제"]},
        "html": """
<p style="{body}">
안녕하세요~가전덕후 SuN 입니다 😊<br><br>
로봇청소기는 이미 집안 일원인데… <b>빨래 개기·설거지·정리까지</b> 해주는 「주는 로봇」은 언제쯤 올까요?<br>
저도 퇴근 후 설거지 보면서 「휴머노이드 빨리 와라」 속으로 외친 적 많아요 ㅋㅋ<br>
오늘은 <b>지금 어디까지 왔는지</b>, <b>언제쯤 현실이 될지</b>, <b>당장 살 수 있는 것</b>까지 정리해볼게요! 로봇청소기부터 휴머노이드까지 한 번에 봅니다.
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_homebot_01_room.png" alt="거실" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">🤖 「주는 로봇」이란 — 기대치부터 맞추기</p>
<p style="{body}">
말 그대로 <b>가사 전반</b>을 사람처럼 해주는 로봇이에요. 청소·설거지·빨래·정리·간단 요리까지.<br>
현재 상용 제품은 대부분 <b>한 가지 일만</b> 잘합니다 — 청소, 창문, 잔디 깎기 등.<br>
「판타지 통합 가사 로봇」과 「실제 2026년 로봇」은 아직 거리가 있어요. 이걸 알고 보면 덜 실망합니다!
</p>

<p style="{sub}">📅 타임라인 — 언제쯤?</p>
<div style="{box}">
<b style="color:#E8837A;">이미 있음 (2020년대)</b><br>
• 로봇청소기·창문로봇·자동 식기세척기·건조기<br>
• <b>반자동</b> — 사람이 전처리·후처리 필요<br><br>
<b style="color:#E8837A;">5~10년 (2030년대 초)</b><br>
• 고급 가정용 <b>로봇 팔</b> — 특정 공간(주방 카운터)에서 제한된 작업<br>
• 호텔·요양 시설 <b>배송·정리 로봇</b> 확대<br><br>
<b style="color:#E8837A;">10년+ (2035~)</b><br>
• 일반 가정용 <b>다목적 휴머노이드</b> — 가격·안전·법규 해결 전제<br>
• 「완전 주는 로봇」보다 <b>가사 70% 보조</b>가 먼저 올 가능성<br><br>
<b style="color:#8A8580;">SuN 한줄</b> — 로봇 기다리는 동안 <b>식세기·건조기</b>부터 채우는 게 현실적이에요.
</div>

<p style="text-align:center; margin:24px 0;">
<img src="blog_homebot_02_vacuum.png" alt="청소로봇" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">🧩 왜 아직 안 왔을까? — 기술·비용·안전</p>
<p style="{body}">
• <b>손의 섬세함</b> — 그릇·옷감·와인잔… 각각 다른 힘 제어<br>
• <b>집마다 다름</b> — 계단·문턱·가구 배치 — 학습 데이터 폭발<br>
• <b>안전</b> — 아이·반려동물 옆에서 팔 휘두르면?<br>
• <b>가격</b> — 연구용 휴머노이드는 수천만 원대<br>
• <b>윤리·일자리</b> — 사회적 논의도 필요<br><br>
직접 로봇청소기 써보면 「맵핑은 잘하는데 의자 발걸이는 못 넘김」 — 이게 가사 로봇 전체의 축소판이에요 ㅎㅎ<br><br>
<b>가격 전망</b>도 봐야 해요. 청소기는 10년 새면 수십만 원대까지 내려왔죠. 휴머노이드도 <b>단일 기능 → 다기능</b> 순으로 가격이 깨질 거예요. 다만 최초 5년은 「비싼 장난감」 구간을 감안해야 합니다.
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_homebot_03_humanoid.png" alt="휴머노이드" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">🏠 지금 집에서 할 수 있는 「로봇 조합」</p>
<p style="{body}">
1️⃣ <b>로봇청소기 + 걸레 모드</b> — 바닥 80% 자동<br>
2️⃣ <b>식기세척기</b> — 설거지 시간 절반↓ (진짜 추천)<br>
3️⃣ <b>건조기</b> — 빨래 개기·널기 스트레스↓<br>
4️⃣ <b>로봇 창문청소</b> — 고층·외창<br>
5️⃣ <b>스마트 플러그·스케줄</b> — 세탁기·공청기 자동화<br><br>
「하나의 주는 로봇」 대신 <b>여러 단일 로봇</b>이 지금의 정답에 가깝습니다. 저희 집도 이 조합이에요.<br><br>
최근 전시회에서 로봇 팔이 <b>컵 하나</b> 집는 데모는 자주 봅니다. 하지만 집 전체를 돌아다니며 <b>상황 판단</b>까지 하는 건 아직 연구실·영상 수준이에요. 마케팅 영상만 보고 기대치 올리지 않는 게 중요합니다.
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_homebot_04_kitchen.png" alt="주방" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">⚖️ 장점과 단점 (미래 로봇 기준)</p>
<p style="{body}">
<b>장점</b> — 시간·체력 절약, 고령·장애 가구 자립, 맞벌이 부담↓<br>
<b>단점</b> — 초기 비용·유지비·고장, 프라이버시(집 내부 맵), <b>기대 과잉</b><br>
<b>주의</b> — 「곧 나온다」 마케팅에 현혹되지 말고 <b>실제 출시·리콜·AS</b> 확인!<br><br>
<b>현실 조언</b> — 로봇 기다리는 동안 <b>가사 분담 앱·루틴</b> 잡는 것도 생각보다 효과 있어요. 기술만이 답은 아니거든요 ㅎㅎ
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_homebot_05_ces.png" alt="전시" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">❓ 자주 묻는 질문</p>
<p style="{body}">
<b>Q. 테슬라 옵티머스 집에 쓸 수 있나요?</b><br>
A. 아직 가정용 판매 아님. 산업·연구 단계.<br><br>
<b>Q. 언제 500만 원 이하로 살 수 있을까?</b><br>
A. 단일 기능 로봇은 이미 그 이하. 다목적은 <b>10년+</b> 낙관적 전망.<br><br>
<b>Q. 아이 있는 집은?</b><br>
A. 안전 인증·속도 제한·작업 구역 제한 필수 — 나올 때까지 기다리는 게 나을 수 있어요.
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_homebot_06_dream.png" alt="미래" style="max-width:100%; border-radius:12px;" />
</p>


<p style="{sub}">📌 SuN 추가 메모 — 읽고 나서 해볼 것</p>
<p style="{body}">
이 주제는 뉴스랑 실생활이 같이 움직여요. 글만 읽고 끝내기보다 <b>오늘 하나</b>만 해보면 체감이 달라집니다.<br>
• 관련 키워드로 네이버·유튜브 <b>최근 3개월</b> 자료만 훑기<br>
• 우리 집·우리 상황에 맞는지 「그대로 따라 하기」 전에 한번 걸러 보기<br>
• 비슷한 고민 댓글 달아 주시면 SuN이 모아서 다음 글로 이어갈게요<br><br>
궁금한 점 있으면 댓글로 남겨 주세요. 같이 정보 보태면 글이 더 단단해집니다 👍
</p>


<p style="{body}">
<b>SuN 한마디 더</b> — 글에서 정리한 내용은 「정답」이라기보다 <b>우리 집 기준 참고</b>예요. 제품·정책·법규는 바뀔 수 있으니, 구매·설정 전에는 공식 안내도 한번 더 확인해 주세요. 비슷한 경험 있으시면 댓글로 공유해 주시면 다음 글에 반영할게요 😊
</p>

<p style="{sub}">💡 SuN의 솔직 한줄평</p>
<p style="{body}">
주는 로봇은 <b>오고는 있지만</b>, 그 전에 <b>조합형 가사 자동화</b>가 먼저 완성될 거예요.<br>
지금 당장 살 돈이 있다면 — 저는 휴머노이드보다 <b>식기세척기+건조기</b>가 체감이 훨씬 큽니다 ㅋㅋ 로봇청소기는 맵핑만 잘 돼도 「주는 로봇」 느낌이 꽤 나거든요.<br><br>
여러분 집엔 어떤 「로봇」 있으세요? 댓글로 가사템 공유해 주세요~ 👋 식세기·건조기 있으면 체감도 같이 알려주세요!
</p>

<p style="{tags}">{tagline}</p>
""",
    },
    12: {
        "title": "전기차 배터리 10년 후 수명 다 된다고? — 꼭 바꿔야 할까",
        "slug": "전기차_배터리_10년_수명",
        "images": [
            {"file": "blog_evbat_01_car.png", "alt": "전기차", "prompt": "electric car charging in apartment underground parking, cable connected, realistic", "shot": "hero"},
            {"file": "blog_evbat_02_gauge.png", "alt": "배터리 잔량", "prompt": "EV dashboard showing battery percentage and range, driver perspective", "shot": "detail"},
            {"file": "blog_evbat_03_service.png", "alt": "서비스센터", "prompt": "car service bay with technician inspecting electric vehicle battery underside lift", "shot": "use"},
            {"file": "blog_evbat_04_graph.png", "alt": "수명 그래프", "prompt": "laptop screen showing battery degradation chart, home desk research", "shot": "compare"},
            {"file": "blog_evbat_05_winter.png", "alt": "겨울 충전", "prompt": "EV charging in cold winter parking lot with breath visible, morning", "shot": "lifestyle"},
            {"file": "blog_evbat_06_road.png", "alt": "드라이브", "prompt": "electric car driving coastal road sunset, peaceful mood realistic photo", "shot": "closing"},
        ],
        "tags": "#전기차 #EV배터리 #배터리수명 #전기차보증 #가전덕후 #SuN #충전 #친환경 #중고전기차 #배터리교체",
        "must_include": {"require_pros": True, "require_cons": True},
        "html": """
<p style="{body}">
안녕하세요~가전덕후 SuN 입니다 😊<br><br>
전기차 살까 말까 검색하다 보면 「배터리 10년 지나면 끝난다」「교체 비용 수천만 원」 같은 말 많죠?<br>
저도 처음엔 겁났는데, 실제 데이터·보증 조건 보고 나서는 <b>생각보다 덜 무섭고</b> — 대신 <b>알아야 할 것</b>이 있더라고요.<br>
오늘은 <b>배터리 수명이란 게 뭔지</b>, <b>10년 후 꼭 바꿔야 하는지</b>, <b>중고 EV 볼 때 팁</b>까지 정리해볼게요! 전기차 고민 중이시면 참고하세요.
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_evbat_01_car.png" alt="전기차" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">🔋 「10년 수명」이 정확히 뭐야?</p>
<p style="{body}">
배터리는 처음보다 <b>용량이 조금씩 줄어듭니다</b> — 스마트폰과 같아요. 이걸 <b>열화(Degradation)</b>라고 해요.<br>
「10년 수명」은 보통 <b>보증 기간</b> 또는 <b>설계 목표</b>를 말하는 경우가 많아요.<br><br>
• <b>80% 잔존 용량</b>까지 보증 — 업체마다 8년/16만 km 등<br>
• 10년 후에도 <b>달리는 건 가능</b> — 다만 <b>주행거리(항속)</b>가 줄어듦<br>
• 「수명 다 됨」≠ 「폐차」 — 대부분 <b>교체·재사용·재활용</b> 선택지가 있음
</p>

<p style="{sub}">📉 왜 줄어들까? — 원리 쉽게</p>
<div style="{box}">
<b style="color:#E8837A;">충전·방전 반복</b> — 화학 반응 누적<br>
<b style="color:#E8837A;">고온·저온</b> — 여름 주차장·겨울 급속충전이 특히 부담<br>
<b style="color:#E8837A;">급속충전 습관</b> — 편하지만 열화 빠를 수 있음<br>
<b style="color:#E8837A;">100% 충전 유지</b> — 장기 주차 시 80~90% 권장<br><br>
<b style="color:#8A8580;">SuN 팁</b> — 「완충만 하면 된다」보다 <b>충전 습관</b>이 수명에 더 큼!
</div>

<p style="text-align:center; margin:24px 0;">
<img src="blog_evbat_02_gauge.png" alt="잔량" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">🔧 10년 후 꼭 배터리를 바꿔야 할까?</p>
<p style="{body}">
<b>꼭은 아닙니다.</b> 이렇게 나뉩니다.<br><br>
<b>Case 1 — 주행거리 충분</b><br>
용량 75~80% 남아도 출퇴근만 하면 <b>그대로 사용</b> 가능. 교체 안 해도 됨.<br><br>
<b>Case 2 — 거리 부족</b><br>
겨울에 반토막 느낌이면 — <b>배터리 팩 교체</b> 또는 차량 교체 검토.<br><br>
<b>Case 3 — 보증 내 급격 열화</b><br>
보증 조건 미달 시 <b>무상·부분 무상</b> — 차대번호·이력 꼭 확인!<br><br>
교체 비용은 차종·용량에 따라 <b>수백만~천만 원+</b> — 중고차 가치와 비교해서 결정하는 게 현실적이에요.<br><br>
<b>참고</b> — 배터리 교체 후에도 <b>차량 가치</b>가 완전히 회복되진 않을 수 있어요. 중고 시장 가격과 비교하세요.<br><br>
국내 제조사는 배터리 보증을 꽤 공격적으로 내세우는 편이에요. 구매 전 <b>보증서 PDF</b>를 꼭 받아서 「80% 미만 시 무상」 조항을 확인하세요. 중고는 이 보증이 이전되는지가 가격을 좌우합니다.
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_evbat_03_service.png" alt="서비스" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">⚖️ 장점과 단점 (전기차 배터리)</p>
<p style="{body}">
<b>장점</b> — 연료비·정비비 절감, 조용함, 보증 제도 점점 성숙<br>
<b>단점</b> — 교체 비용 부담, 겨울 주행거리↓, 충전 인프라 편차<br>
<b>주의</b> — 「무료 교체」 이벤트 <b>조건·기간</b> 꼼꼼히! 중고는 <b>SOH(건강도)</b> 리포트 요청<br><br>
<b>추가 팁</b> — 급속충전소만 찾기보다 <b>집 완속 충전</b> 습관이 배터리에 더 유리한 경우가 많습니다.
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_evbat_04_graph.png" alt="그래프" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">🛡️ 수명 늘리는 운전·충전 팁</p>
<p style="{body}">
1️⃣ 급속충전만 고집하지 않기 — 완속 병행<br>
2️⃣ 장기 주차 시 50~70% 유지<br>
3️⃣ 여름 직사광선 주차 줄이기<br>
4️⃣ 급가속·급제동 줄이기<br>
5️⃣ 정기 점검 — 냉각 시스템·BMS 오류 조기 발견<br><br>
제가 렌트 EV 몇 번 타보면서 느낀 건 — <b>운전 스타일</b>이 배터리보다 먼저 체감에 영향 준다는 거예요.<br><br>
<b>겨울철</b>은 배터리 체감이 확 떨어집니다. 예열(프리컨디셔닝) 기능 쓰면 편하지만 전력 소모는 늘어요. 출발 10분 전 앱으로 예열 + 완속 충전 위주가 배터리에 덜 무리라는 말이 많아요.
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_evbat_05_winter.png" alt="겨울" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">❓ 자주 묻는 질문</p>
<p style="{body}">
<b>Q. 중고 EV 사도 되나요?</b><br>
A. SOH 85% 이상 + 보증 잔여 확인 시 가능. 저가 + 열화 심하면 비추.<br><br>
<b>Q. 배터리 화재 위험?</b><br>
A. 통계상 희귀하지만, 충돌·수리 이력 확인 필수.<br><br>
<b>Q. 폐배터리는?</b><br>
A. 재활용 산업 커지는 중 — 「폐기물」만은 아닙니다.
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_evbat_06_road.png" alt="드라이브" style="max-width:100%; border-radius:12px;" />
</p>


<p style="{sub}">📌 SuN 추가 메모 — 읽고 나서 해볼 것</p>
<p style="{body}">
이 주제는 뉴스랑 실생활이 같이 움직여요. 글만 읽고 끝내기보다 <b>오늘 하나</b>만 해보면 체감이 달라집니다.<br>
• 관련 키워드로 네이버·유튜브 <b>최근 3개월</b> 자료만 훑기<br>
• 우리 집·우리 상황에 맞는지 「그대로 따라 하기」 전에 한번 걸러 보기<br>
• 비슷한 고민 댓글 달아 주시면 SuN이 모아서 다음 글로 이어갈게요<br><br>
궁금한 점 있으면 댓글로 남겨 주세요. 같이 정보 보태면 글이 더 단단해집니다 👍
</p>


<p style="{body}">
<b>SuN 한마디 더</b> — 글에서 정리한 내용은 「정답」이라기보다 <b>우리 집 기준 참고</b>예요. 제품·정책·법규는 바뀔 수 있으니, 구매·설정 전에는 공식 안내도 한번 더 확인해 주세요. 비슷한 경험 있으시면 댓글로 공유해 주시면 다음 글에 반영할게요 😊
</p>

<p style="{sub}">💡 SuN의 솔직 한줄평</p>
<p style="{body}">
「10년 후 배터리 끝」은 <b>과장된 공포</b>에 가깝고, <b>주행거리 감소</b>가 더 정확한 표현이에요.<br>
꼭 바꿀지는 <b>내 사용 패턴·차 가치</b>로 결정하면 됩니다. 장거리 출퇴근이면 70%대 용량도 불편하지만, 동네 마실용이면 그대로 타도 충분한 경우가 많아요.<br><br>
전기차 타보신 분, 몇 년 차이신가요? 배터리 체감 댓글로 알려주세요~ 👋 겨울 주행거리 변화도 궁금해요! 중고 EV 고민도 환영합니다.
</p>

<p style="{tags}">{tagline}</p>
""",
    },
    13: {
        "title": "청소용 알콜, 어디까지 소독될까? — 활용법과 주의사항",
        "slug": "청소용_알콜_소독_활용",
        "images": [
            {"file": "blog_alcohol_01_bottle.png", "alt": "알콜 병", "prompt": "hand holding isopropyl alcohol spray bottle over kitchen counter, natural light", "shot": "hero"},
            {"file": "blog_alcohol_02_wipe.png", "alt": "손 소독", "prompt": "wiping smartphone and keyboard with alcohol wipe at home desk", "shot": "use"},
            {"file": "blog_alcohol_03_phone.png", "alt": "가전 리모컨", "prompt": "cleaning TV remote control with cotton pad and alcohol, close-up", "shot": "detail"},
            {"file": "blog_alcohol_04_kitchen.png", "alt": "주방", "prompt": "kitchen counter disinfection with spray and cloth, stove in background", "shot": "lifestyle"},
            {"file": "blog_alcohol_05_label.png", "alt": "성분표", "prompt": "reading alcohol concentration label on bottle close-up shallow depth", "shot": "compare"},
            {"file": "blog_alcohol_06_safe.png", "alt": "환기", "prompt": "open window ventilation in bathroom after cleaning, fresh air mood", "shot": "closing"},
        ],
        "tags": "#청소용알콜 #소독 #살균 #생활팁 #가전청소 #가전덕후 #SuN #코로나 #위생 #홈케어",
        "must_include": {"require_howto": True},
        "html": """
<p style="{body}">
안녕하세요~가전덕후 SuN 입니다 😊<br><br>
집에 청소용 알콜 한 병쯤은 다 있죠? 근데 <b>어디까지 소독이 되는지</b>, 뭘 닦으면 되고 뭘 닦으면 안 되는지 헷갈리시는 분 많아요.<br>
저도 리모컨에 뿌렸다가 코팅 벗겨진 적 있어서… ㅎㅎ <b>직접 써보며</b> 정리한 활용법 공유할게요!
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_alcohol_01_bottle.png" alt="알콜" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">🧪 청소용 알콜이란? — 에탄올·이소프로필</p>
<p style="{body}">
보통 <b>에탄올(식용주 정제)</b> 또는 <b>이소프로필알코올(IPA)</b> 기반입니다.<br>
<b>소독·살균</b> 원리는 — 단백질을 변성시켜 세균·일부 바이러스 외피를 깨는 거예요.<br><br>
중요한 건 <b>농도</b>!<br>
• <b>70~85%</b> — 손·표면 소독에 가장 흔함 (너무 높으면 오히려 효과↓)<br>
• <b>99%</b> — 전자부품·기름때 제거엔 쓰이지만 <b>손 소독엔 희석</b> 권장<br><br>
「숫자 클수록 좋다」 아닙니다. 라벨부터 확인하세요!<br><br>
<b>소독 vs 청소</b>도 구분하세요. 먼지·기름때는 알콜 전에 <b>세제로 세척</b>하는 게 맞고, 그다음 알콜로 마무리 살균하는 순서가 효과적이에요. 이 순서를 지키면 생각보다 위생 효과가 좋아집니다.
</p>

<p style="{sub}">✅ 어디까지 소독되나? — 되는 것 vs 애매한 것</p>
<div style="{box}">
<b style="color:#E8837A;">잘 되는 것</b><br>
• 스마트폰·리모컨·마우스·키보드 (전원 OFF 후)<br>
• 문손잡이·스위치·테이블<br>
• 가전 <b>외부 플라스틱·유리</b> (테스트 후 전체)<br><br>
<b style="color:#E8837A;">애매하거나 부족</b><br>
• <b>노로·로타</b> 등 일부 바이러스 — 알콜만으로 부족할 수 있음<br>
• <b>포자·곰팡이</b> — 전용 살균제가 나음<br>
• <b>피·체액 오염</b> — 먼저 세제로 세척 후 알콜<br><br>
<b style="color:#E8837A;">하면 안 되는 것</b><br>
• <b>TV·모니터 화면</b> (코팅 손상) — 전용 클리너<br>
• <b>가죽·실크·페인트 미완</b> — 변색·손상<br>
• <b>열린 상처</b> — 자극·지연 치유
</div>

<p style="text-align:center; margin:24px 0;">
<img src="blog_alcohol_02_wipe.png" alt="닦기" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">📋 활용 Step 1~5 — SuN이 쓰는 순서</p>
<p style="{body}">
<b>1. 전원 끄기</b> — 스마트폰·리모컨·노트북<br>
<b>2. 분무→천</b> — 기기에 직접 뿌리지 말고 <b>천에 뭍혀</b> 닦기 (액체 유입 방지)<br>
<b>3. 30초 이상 말리기</b> — 습기 남으면 고장·부식<br>
<b>4. 환기</b> — 창문 열고 5분 (흡입·화재 주의)<br>
<b>5. 주 1~2회</b> — 매일 과다 사용은 코팅·플라스틱에 안 좋음<br><br>
가전덕후로서 리모컨·에어컨 리모컨·공청기 버튼은 <b>일주일에 한 번</b> 루틴으로 두고 있어요.<br><br>
<b>보관 팁</b> — 알콜은 <b>서늘한 곳·직사광선 피함</b>, 어린이 손 닿지 않게. 뚜껑 꼭 닫기 — 휘발이라 농도가 빨리 떨어질 수 있어요.
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_alcohol_03_phone.png" alt="리모컨" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">⚖️ 장점과 단점</p>
<p style="{body}">
<b>장점</b> — 저렴, 빠름, 휘발성이라 잔여물 적음, 가전·핸드폰 위생에 편함<br>
<b>단점</b> — <b>인화성</b>, 피부 건조, 일부 소재 손상, 모든 병원균에 만능 아님<br>
<b>주의</b> — 가스레인지·초등 근처 사용 금지, 어린이 손 닿는 곳 보관
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_alcohol_04_kitchen.png" alt="주방" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">🆚 락스·손소독제와 뭐가 다를까?</p>
<p style="{body}">
• <b>락스(염소)</b> — 바닥·욕실 곰팡이, 표백. 금속·전자기기엔 비추<br>
• <b>손소독제 겔</b> — 외출·이동 중 손용. 집안 대형 표면엔 알콜 분무가 나음<br>
• <b>전용 가전 클리너</b> — TV·냉장고 스테인리스 — 알콜보다 안전한 경우 많음<br><br>
목적별로 <b>섞어 쓰는 것</b>이 정답이에요. 한 가지만 고집하지 마세요!<br><br>
냉장고 손잡이·세탁기 패널처럼 <b>자주 만지는 가전</b>은 알콜 닦기 루틴에 넣기 좋아요. 반면 스테인리스는 전용 폴리시가 물때·지문에 더 나을 때도 있습니다. 한번 닦아보고 광택·변색 여부를 확인하는 게 안전합니다.
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_alcohol_05_label.png" alt="라벨" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">❓ 자주 묻는 질문</p>
<p style="{body}">
<b>Q. 노트북 키보드에 써도 되나요?</b><br>
A. 얇게 천에 뭍혀 가볍게. 과다 분사는 키 스위치 침수 위험.<br><br>
<b>Q. 아이 장난감은?</b><br>
A. 플라스틱은 가능. 페인트·스티커 있는 건 물+중성세제가 나음.<br><br>
<b>Q. 만료됐는데 버려야 하나요?</b><br>
A. 휘발성이라 오래되면 농도↓. 소독 목적이면 새 제품 권장.<br><br>
<b>Q. 에어컨 필터에 뿌려도 되나요?</b><br>
A. 비추. 섬유·코팅 손상. 필터는 <b>물 세척·건조</b> 후 재장착이 맞아요.
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_alcohol_06_safe.png" alt="환기" style="max-width:100%; border-radius:12px;" />
</p>


<p style="{sub}">📌 SuN 추가 메모 — 읽고 나서 해볼 것</p>
<p style="{body}">
이 주제는 뉴스랑 실생활이 같이 움직여요. 글만 읽고 끝내기보다 <b>오늘 하나</b>만 해보면 체감이 달라집니다.<br>
• 관련 키워드로 네이버·유튜브 <b>최근 3개월</b> 자료만 훑기<br>
• 우리 집·우리 상황에 맞는지 「그대로 따라 하기」 전에 한번 걸러 보기<br>
• 비슷한 고민 댓글 달아 주시면 SuN이 모아서 다음 글로 이어갈게요<br><br>
궁금한 점 있으면 댓글로 남겨 주세요. 같이 정보 보태면 글이 더 단단해집니다 👍
</p>


<p style="{body}">
<b>SuN 한마디 더</b> — 글에서 정리한 내용은 「정답」이라기보다 <b>우리 집 기준 참고</b>예요. 제품·정책·법규는 바뀔 수 있으니, 구매·설정 전에는 공식 안내도 한번 더 확인해 주세요. 비슷한 경험 있으시면 댓글로 공유해 주시면 다음 글에 반영할게요 😊
</p>

<p style="{sub}">💡 SuN의 솔직 한줄평</p>
<p style="{body}">
청소용 알콜은 <b>일상 위생의 만능 열쇠</b>에 가깝지만, <b>화면·코팅·화재</b>만 조심하면 됩니다.<br>
오늘 저녁에 리모컨 하나만 닦아보세요 — 생각보다 먼지·기름때… 깜짝 놀랄 수 있어요 ㅋㅋ 공기청정기 필터 근처도 알콜 대신 <b>전용 청소</b> 권장이니 제품 설명서도 같이 보세요.<br><br>
여러분은 알콜로 어떤 가전 닦으세요? 댓글로 꿀팁 알려주세요~ 👋 TV·모니터는 전용제 쓰는지도 들려주세요!
</p>

<p style="{tags}">{tagline}</p>
""",
    },
    14: {
        "title": "우주 데이터센터는 정말 현실이 될 수 있을까? — SpaceX부터 지상까지",
        "slug": "우주_데이터센터_현실",
        "images": [
            {"file": "blog_spacedc_01_orbit.png", "alt": "지구 궤도", "prompt": "satellite orbiting Earth with solar panels, realistic space documentary style", "shot": "hero"},
            {"file": "blog_spacedc_02_dc.png", "alt": "지상 데이터센터", "prompt": "large ground data center cooling towers and servers aerial nearby view", "shot": "compare"},
            {"file": "blog_spacedc_03_rocket.png", "alt": "로켓", "prompt": "rocket launch at dusk from distance, long exposure trail realistic", "shot": "lifestyle"},
            {"file": "blog_spacedc_04_solar.png", "alt": "태양광", "prompt": "solar panel array in desert sunlight heat shimmer, wide shot", "shot": "detail"},
            {"file": "blog_spacedc_05_news.png", "alt": "기사", "prompt": "person reading space tech news on laptop in dark room, face lit by screen", "shot": "use"},
            {"file": "blog_spacedc_06_night.png", "alt": "밤하늘", "prompt": "starry night sky over quiet rooftop, contemplative mood, no fantasy", "shot": "closing"},
        ],
        "tags": "#우주데이터센터 #SpaceX #위성 #데이터센터 #AI인프라 #가전덕후 #SuN #클라우드 #신재생 #테크트렌드",
        "html": """
<p style="{body}">
안녕하세요~오늘의 핫한 IT이야기를 알려드리러 온 SuN 입니다 🔥<br><br>
「AI가 먹는 전기 너무 많다」는 뉴스 보면서, <b>우주에 데이터센터 올리자</b>는 얘기도 나오죠.<br>
처음엔 SF인 줄 알았는데 — SpaceX·위성 인터넷·태양광 조합 보면 <b>그럴듯해</b> 보이기도 해요 ㅋㅋ<br>
저도 스타링크 뉴스 보면서 「위성이 데이터센터 되는 거 아닌가」 싶어서 직접 자료 찾아봤거든요. 생각보다 <b>지상 문제가 더 급해서</b> 우주는 아직 실험 단계에 가깝더라고요.<br>
오늘은 <b>우주 DC가 현실이 될 수 있는지</b>, <b>장점·맹점·타임라인</b>까지 정리해볼게요!
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_spacedc_01_orbit.png" alt="궤도" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">🛰️ 우주 데이터센터란? — 개념 30초</p>
<p style="{body}">
지상 대신 <b>저궤도 위성(LEO)</b>이나 달·궤도 스테이션에 <b>서버·저장·연산</b> 시설을 두는 상상이에요.<br>
지상 데이터센터 문제 — <b>전력·냉각·부지·탄소</b> — 을 우주에서 풀자는 거죠.<br><br>
태양광은 궤도에서 <b>24시간 가까이</b> 받을 수 있고, 진공은 <b>공랭각</b> 냉각에 유리합니다. 이론은 예쁘죠!<br><br>
국내에서도 AI 데이터센터 전력 이슈가 뉴스에 자주 나오죠. 우주 DC는 그 불만의 <b>극단적 상상</b>이면서, 동시에 일부 기업의 <b>실험 과제</b>이기도 합니다.
</p>

<p style="{sub}">✨ 왜 나오는 말이야? — 지상 DC의 압박</p>
<div style="{box}">
<b style="color:#E8837A;">AI 학습·추론 폭증</b> — GPU 전력 수 MW 단위<br>
<b style="color:#E8837A;">냉각수·전력망</b> — 지역 민원·비용<br>
<b style="color:#E8837A;">재생에너지 한계</b> — 밤·무풍 때 공급 불안<br>
<b style="color:#E8837A;">우주 발사 비용 하락</b> — 재사용 로켓으로 kg당 비용↓
</div>

<p style="text-align:center; margin:24px 0;">
<img src="blog_spacedc_02_dc.png" alt="지상 DC" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">🤔 현실이 될 수 있을까? — 가능한 부분 vs 맹점</p>
<p style="{body}">
<b>가능성 있는 부분</b><br>
✅ <b>엣지·캐시 위성</b> — CDN처럼 가벼운 연산·저장 (이미 비슷한 것 있음)<br>
✅ <b>특수 목적</b> — 군사·기상·과학 데이터 처리<br>
✅ <b>극소량 파일럿</b> — 2030년대 초 시험 가능<br><br>
<b>맹점·난제</b><br>
❌ <b>업링크·다운링크 지연</b> — 실시간 AI 서비스엔 불리<br>
❌ <b>방사선·우주 쓰레기</b> — 하드웨어 수명·교체 비용<br>
❌ <b>수리·업그레이드</b> — 사람 보내거나 로봇… 둘 다 비쌈<br>
❌ <b>전체 클라우드를 우주로</b> — 경제성 아직 안 나옴<br><br>
저는 「일부 워크로드」는 가능, 「네이버·구글 전부 우주」는 아직 멀다고 봅니다.
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_spacedc_03_rocket.png" alt="로켓" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">⏳ 타임라인 — 솔직 버전</p>
<p style="{body}">
<b>지금~2030</b> — 위성 인터넷·온디바이스 AI 확대 (우주 DC 본격 X)<br>
<b>2030~2040</b> — 파일럿급 우주 연산 실험, 지상과 <b>하이브리드</b><br>
<b>2040+</b> — 기술·비용 따라 상용화 일부 가능성 — <b>불확실 큼</b><br><br>
「언제」보다 <b>「무슨 일만 우주로 보낼까」</b>가 먼저 정해질 거예요.<br><br>
예를 들어 <b>AI 학습용 대용량 아카이브</b>는 지상이 유리하고, <b>재난 백업·캐시</b> 일부만 위성이 유리할 수 있어요. 전부를 우주로 옮기는 그림보다 <b>하이브리드</b>가 현실적입니다.
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_spacedc_04_solar.png" alt="태양광" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">⚖️ 장점과 단점</p>
<p style="{body}">
<b>장점</b> — 태양광·냉각 잠재 이점, 지상 부지·민원 회피, 재난 분산<br>
<b>단점</b> — 발사·유지비, 지연, 방사선, 규제·국제법, <b>환경(우주 쓰레기)</b><br>
<b>주의</b> — 마케팅 PPT와 실제 상용은 거리가 멉니다 — 투자·뉴스 볼 때 구분!<br><br>
<b>관련 키워드</b> — 우주 DC와 함께 보면 좋은 건 <b>태양광·에너지 저장(ESS)·엣지 컴퓨팅</b>이에요. 한 기술만 파지 말고 묶어서 보면 그림이 선명해집니다.
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_spacedc_05_news.png" alt="뉴스" style="max-width:100%; border-radius:12px;" />
</p>

<p style="{sub}">🏠 우리 일상과의 거리</p>
<p style="{body}">
당장 스마트폰 요금제가 우주 DC 때문에 바뀌진 않아요.<br>
다만 AI 서비스가 늘면서 <b>전기·탄소</b> 이슈는 커지고, 그게 우주 얘기로 연결되는 거죠.<br>
가전덕후 관점에선 — 집에서 <b>에너지 효율 좋은 가전</b> 고르는 것도 같은 흐름의 작은 참여예요 ㅎㅎ<br><br>
우주 DC가 되든 안 되든, <b>전기 많이 먹는 기기</b>를 줄이는 습관은 우리 손 안에 있습니다. 에어컨·건조기·온수기 같은 대형 가전 스펙 볼 때 <b>1년 예상 전력량</b> 라벨도 같이 보세요!
</p>

<p style="text-align:center; margin:24px 0;">
<img src="blog_spacedc_06_night.png" alt="밤하늘" style="max-width:100%; border-radius:12px;" />
</p>


<p style="{sub}">📌 SuN 추가 메모 — 읽고 나서 해볼 것</p>
<p style="{body}">
이 주제는 뉴스랑 실생활이 같이 움직여요. 글만 읽고 끝내기보다 <b>오늘 하나</b>만 해보면 체감이 달라집니다.<br>
• 관련 키워드로 네이버·유튜브 <b>최근 3개월</b> 자료만 훑기<br>
• 우리 집·우리 상황에 맞는지 「그대로 따라 하기」 전에 한번 걸러 보기<br>
• 비슷한 고민 댓글 달아 주시면 SuN이 모아서 다음 글로 이어갈게요<br><br>
궁금한 점 있으면 댓글로 남겨 주세요. 같이 정보 보태면 글이 더 단단해집니다 👍
</p>


<p style="{body}">
<b>SuN 한마디 더</b> — 글에서 정리한 내용은 「정답」이라기보다 <b>우리 집 기준 참고</b>예요. 제품·정책·법규는 바뀔 수 있으니, 구매·설정 전에는 공식 안내도 한번 더 확인해 주세요. 비슷한 경험 있으시면 댓글로 공유해 주시면 다음 글에 반영할게요 😊
</p>

<p style="{sub}">💡 SuN의 솔직 한줄평</p>
<p style="{body}">
우주 데이터센터는 <b>완전 헛소리는 아니지만</b>, 당분간은 「지상 DC + 위성 링크」 조합이 현실입니다.<br>
SF처럼 들려도 — 10년 뒤 「일부만 우주」는 있을 수 있어요. 지켜보는 재미는 충분! 당장은 <b>지상 데이터센터 재생에너지</b> 뉴스가 더 우리 생활과 가깝습니다.<br><br>
우주 IT 뉴스 중에 궁금한 거 있으면 댓글로 던져주세요~ 👋 지상 데이터센터 전력 이슈도 같이 얘기해요!
</p>

<p style="{tags}">{tagline}</p>
""",
    },
}
