# 캐릭터 말투 A/B 주간 실험

성격 중심 프롬프트를 검증하기 위한 **7일 × 3~4회** 대화 로그·패턴 분석 가이드.

## 원칙

- 캐릭터에게 "이렇게 말해"가 아니라 **"너는 이런 사람이야"** (`data/characterIdentities.ts` 자기소개서).
- A/B/C는 **캐릭터 정체성 위에 하루 단위로 얹는 톤 실험**이다.

| 변형 | 라벨 | 설명 |
|------|------|------|
| A | 다정 | 공감·위로 최우선 |
| B | 현실적 | 담백·일상·직장인 감각 |
| C | 친구 | 가벼운 비속어·드립 (무례 금지) |

## 일정 (기본)

| 일차 | 변형 |
|------|------|
| 1일 | A |
| 2일 | B |
| 3일 | C |
| 4~7일 | A→B→C→A 반복 |

슬롯: **아침 · 점심 · 저녁** (+ 가끔 **새벽**)

## 실행

```bash
# 1회 (수동 메시지)
npx tsx scripts/character_voice_ab_run.mts --character yuna --variant A --slot morning --user "오늘 야근각이야"

# 7일 자동 (API 필요, .env.local DEEPSEEK_API_KEY)
npx tsx scripts/character_voice_ab_week.mts --character yuna

# 새벽 제외 3일만
npx tsx scripts/character_voice_ab_week.mts --character narin --days 3 --no-dawn
```

## 로그 위치

- **대화 텍스트**: `experiments/voice-ab/logs/{날짜}/{캐릭터}-{슬롯}-{변형}.md`
- **통합 저널**: `experiments/voice-ab/journal.jsonl` (+ 앱: `journal-app.jsonl`)
- **일별 선호 기록**: `experiments/voice-ab/daily-notes/YYYY-MM-DD.md`

### 앱 채팅 자동 저널

채팅 1턴이 끝나면 Supabase `chat_voice_journal`에 자동 저장됩니다.

```bash
# 마이그레이션 (최초 1회)
npx supabase db push

# 앱에서 대화한 뒤 로컬로 내려받기
npm run voice:journal:export

# 분석 (AB + 앱 저널 병합)
npm run voice:ab:analyze
```

로그인 상태에서 `GET /api/voice-journal/export?format=json` 으로도 export 가능합니다.

### daily-notes 예시

```markdown
오늘 마음에 든 말투: B
살아있게 느껴진 순간: "그래, 오늘 진짜 길었겠다" — 먼저 공감한 부분
아쉬운 점: 뒤에 해결책이 길어짐
```

## 일주일 후 분석

```bash
npx tsx scripts/analyze_voice_ab_logs.mts
```

출력: `experiments/voice-ab/reports/latest.md`

확인할 것:

- 어떤 말투( A/B/C )에서 **인간 리액션·공감** 점수가 높은지
- **데이터 톤**이 과하면 윤서 외 캐릭터도 붕괴했는지
- 수정은 주로 `data/characterIdentities.ts` 자기소개서, `prompts/base.ts`

## 앱에서 직접 대화할 때

프로덕션 API에는 A/B 오버레이가 기본 **미적용**이다.  
실험은 스크립트 또는 향후 `VOICE_AB_VARIANT` env 연동으로 확장 가능.

## 자기소개서 수정

각 캐릭터 `selfIntroduction`은 **1인칭 서사**로 유지한다.  
"나는 지친 사람에게 ~라고 먼저 말하는 존재" 형식.  
예시 멘트 나열은 넣지 않는다 — 성격에서 말이 나오게 한다.
