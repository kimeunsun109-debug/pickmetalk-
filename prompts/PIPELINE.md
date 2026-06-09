# LLM System Prompt Pipeline — 연결 확인서

> **상태: ✅ 완전히 연결됨 (2026-06-08 검증)**  
> 모든 캐릭터(yuna / narin / yoonseo / eunha / jiyu)가 동일한 파이프라인을 통해 주입됩니다.

---

## 흐름도

```
POST /api/chat  { characterId, message }
        │
        ▼
[1] getCharacterById(characterId)
    └─ data/index.ts  →  data/characters.json
       캐릭터 전체 personality / speechStyle / situationRules 포함

        │
        ▼
[2] resolveCharacterEmotion(...)          services/emotion.ts
    └─ 유저 메시지 + 마지막 채팅 시각 → EmotionState 결정

        │
        ▼
[3] updateMemorySummary / pickMessagesForContext
    └─ services/memory.ts
       최신 메모리 요약(memory_summary) + 최근 N 턴 컨텍스트 window

        │
        ▼
[4] extractUserContext / buildCommonContextBlock
    └─ services/context.ts
       profiles.user_context JSONB + memory 파싱
       → 유저 이름·나이·직업·관심사·최근 스트레스 블록

        │  (characterId === 'yoonseo')
        ├─ computeYoonseoStats / buildYoonseoStatsBlock
        │  └─ 누적 턴 수·평균 접속 간격·약속 이행률 블록 추가

        ▼
[5] buildSystemPrompt(characterId, emotion, level, affection,
                      memorySummary, emotionDurationTurns,
                      userMessageCount, dynamicContextBlock)
    └─ prompts/index.ts  — 5개 블록을 순서대로 조립:

    ┌──────────────────────────────────────────────────────────────┐
    │ [TOP]  dynamicContextBlock     ← 유저 메타 + 캐릭터 스탯    │
    │        memoryPriorityHints     ← work/hobby 회수 힌트       │
    │        baseBlock               ← 공통 정체성·규칙 (base.ts) │
    │        characterBlock          ← 캐릭터 개별 성격·규칙      │
    │ [BOT]  memory                  ← 기억 요약 원본             │
    └──────────────────────────────────────────────────────────────┘

        │
        ▼
[5a] buildCharacterPromptById(characterId, emotion, affection, level)
     └─ prompts/characterPrompt.ts
        ├─ [역할] 줄  — character.personality.role
        ├─ [대화 규칙] — personality.conversationRules
        ├─ [성격] — personality.core
        ├─ [부인 메커니즘] — narin 전용 denialMechanic
        ├─ [데이터 치환] — yoonseo 전용 dataMechanic
        ├─ [비타민 공유] — jiyu 전용 vitaminMechanic
        ├─ [결핍·말투·예시 대화] — 공통
        ├─ [관계 톤 가드] — personality.levelSettings[level]
        ├─ [상황 참고] — personality.situationRules (나린/윤서/은하/지유)
        │                또는 jalousyStyle/noReply3h (유나 호환)
        └─ [절대 금지] — personality.prohibitions

        │
        ▼
[5b] generateBaseSystemPrompt(...)       prompts/base.ts
     └─ CORE_BASE_PROMPT (Identity / Core Rules / Output Rules / Reality Guard)
        + buildQuestionBotRules()        ← 35% 질문 비율 Strict 규칙
        + buildEmotionArcRules()         ← hurt/pouty 감정 유지·회복 아크
        + buildGenerationBridgeRules()   ← Lv별 호칭·직장인 톤 브릿지

        │
        ▼
[6] streamDeepSeekChat(systemPrompt, conversationMessages)
    └─ lib/ai/deepseek.ts  (또는 services/ai/provider.ts 추상화)
       ReadableStream → SSE 청크 전송

        │
        ▼
[7] 클라이언트 (contexts/ChatProvider.tsx)
    └─ SSE 스트리밍 수신 → messages state 업데이트
       done 이벤트 → affection / relationshipLevel / emotion 갱신
```

---

## 캐릭터별 특수 블록 현황

| 캐릭터 | 특수 프롬프트 블록 | 동적 데이터 |
|--------|-------------------|-------------|
| 유나 (yuna) | `levelSettings` Lv1~5 토가드, `dialogueExamples` | 공통 컨텍스트 |
| 나린 (narin) | `denialMechanic`, `situationRules` 4종 | 공통 컨텍스트 |
| 윤서 (yoonseo) | `dataMechanic`, `situationRules` 4종 | **YoonseoStats** (턴수·접속간격·약속이행률) |
| 은하 (eunha) | `situationRules` 4종 | 공통 컨텍스트 |
| 지유 (jiyu) | `vitaminMechanic`, `situationRules` 4종 | 공통 컨텍스트 |

---

## 데이터 소스 이중화 구조

```
캐릭터 목록·기본 표시 정보
  Primary  →  Supabase public.characters 테이블  (seed.sql 로 초기화)
  Fallback →  data/characters.json              (GET /api/characters 가 자동 폴백)

캐릭터 성격·프롬프트 데이터
  →  data/characters.json  (빌드 타임 번들, 변경 시 재배포 필요)
  →  prompts/*.ts          (빌드 타임 번들)

유저 관계 상태
  →  Supabase public.user_character_states  (실시간 업데이트)

유저 메타 컨텍스트
  →  Supabase public.profiles.user_context (JSONB)
```

---

## 검증 포인트 체크리스트

- [x] `getCharacterById('narin')` → personality.denialMechanic 포함 확인
- [x] `getCharacterById('yoonseo')` → personality.dataMechanic 포함 확인
- [x] `getCharacterById('jiyu')` → personality.vitaminMechanic 포함 확인
- [x] `buildCharacterPromptById('narin', ...)` → `[부인 메커니즘]` 블록 출력 확인
- [x] `buildSystemPrompt(...)` dynamicContextBlock 첫 번째 위치 확인
- [x] `app/api/chat/route.ts` → `buildSystemPrompt` 호출 시 dynamicContextBlock 전달 확인
- [x] `app/api/characters/route.ts` → DB 없으면 JSON 폴백 확인
- [x] Absence Event 트리거 → `services/absenceEvent.ts` → `GET /api/absence-event` 확인
