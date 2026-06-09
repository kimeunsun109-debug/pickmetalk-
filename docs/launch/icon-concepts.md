# 앱 아이콘 콘셉트 5개

> 사이즈: 512×512px (플레이스토어 기준)
> 형식: PNG, 투명 배경 없음 (배경색 필수)
> 권장 제작 도구: Figma / Adobe Illustrator / Midjourney + 후보정

---

## 콘셉트 A — **하트 + 채팅 버블** ⭐ 1순위 추천

```
배경: 부드러운 핑크 그라디언트 (#FF8FAB → #FFCCD5)
중앙: 채팅 말풍선 안에 하트가 뛰는 형태
      말풍선 = 흰색, 약간의 그림자
      하트 = 핑크 → 딥로즈 그라디언트, 작은 진동 느낌
스타일: 플랫 + 미니멀 / 모서리 라운드 처리
인상: 대화 + 사랑이 한 번에 전달됨. 직관적이고 따뜻함.
```

**Midjourney 프롬프트:**
```
flat vector app icon, chat bubble with a pink heart inside, 
soft pink gradient background #FF8FAB to #FFCCD5, 
minimal clean design, rounded corners, 512x512, 
white chat bubble with drop shadow, 
warm and romantic feeling, no text --ar 1:1 --style raw
```

---

## 콘셉트 B — **소녀 실루엣 + 달빛**

```
배경: 딥 인디고 → 핑크 그라디언트 (야경 느낌)
중앙: 창문 앞에 앉아 스마트폰을 보는 소녀 실루엣 (뒷모습)
      달이 배경에 크게
스타일: 감성적 일러스트, 수채화 터치
인상: 은하 캐릭터 느낌. 새벽 감성, 감성적 앱 정체성 강조.
```

**Midjourney 프롬프트:**
```
flat app icon illustration, silhouette of a girl sitting by a window 
looking at her phone, large moon in background, 
deep indigo to pink gradient sky, minimal watercolor style, 
romantic midnight aesthetic, 512x512 --ar 1:1 --style raw
```

---

## 콘셉트 C — **AI + 하트 회로** (기술 감성 혼합)

```
배경: 아이보리 (#FFF8F0) 또는 소프트 화이트
중앙: 하트 모양 안에 미세한 회로 패턴 (AI 느낌)
      하트 외곽선 = 핑크, 내부 회로 = 연한 선
스타일: 라인아트 + 플랫 미니멀
인상: "이건 AI지만 감성이 있다"는 이중적 메시지. 독창적.
```

**Midjourney 프롬프트:**
```
minimal app icon, heart shape with delicate circuit board pattern inside,
pink outline heart, soft ivory background #FFF8F0,
line art style, clean and modern, subtle tech aesthetic,
warm and romantic tone, 512x512 --ar 1:1
```

---

## 콘셉트 D — **봄꽃 + 말풍선**

```
배경: 연한 아이보리 → 살구빛 그라디언트
중앙: 둥근 말풍선 주변에 벚꽃 잎이 날리는 구성
      말풍선 = 핑크 계열, 안에 세 개의 점(...)
스타일: 부드러운 일러스트, 일본 앱 감성
인상: 계절 감성, 설레는 봄 연애 분위기.
```

**Midjourney 프롬프트:**
```
soft app icon illustration, round pink chat bubble with three dots,
cherry blossom petals floating around, 
warm peach to ivory gradient background,
cute kawaii japanese style, spring romance aesthetic, 
512x512 --ar 1:1 --style raw
```

---

## 콘셉트 E — **이니셜 타이포 + 감성 배경** (심플 브랜딩)

```
배경: 딥핑크 (#E91E63) 단색 또는 그라디언트
중앙: 한글 "연" 또는 영문 "Y" 을 크고 대담하게
      글자 주변에 하트, 별 등 작은 요소
스타일: 굵은 산세리프 타이포 + 플랫 디자인
인상: 앱 이름이 아이콘에서 바로 연상. 브랜딩 일관성 강함.
```

**Midjourney 프롬프트:**
```
app icon with large Korean character "연" in bold white font,
deep pink background #E91E63, small heart and star decorations,
minimal flat design, strong brand identity, 
512x512, clean and modern --ar 1:1
```

---

## 제작 우선순위 및 체크리스트

```
□ 콘셉트 A (말풍선+하트) — 직관적. 가장 먼저 제작
□ 콘셉트 B (소녀 실루엣) — 감성 강화. A 대안
□ A/B 테스트: 두 버전 제작 후 사용자 반응 비교

필수 체크:
□ 512×512px PNG 저장 → public/icons/icon-512x512.png 교체
□ node scripts/png-convert.mjs 실행 → 나머지 7사이즈 자동 생성
□ public/manifest.json icons 경로 확인
□ Android Studio → res/mipmap 폴더에 아이콘 배치
```
