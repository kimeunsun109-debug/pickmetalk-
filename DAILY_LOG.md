# PickmeTalk Daily Development Log

---

## 2026-08-27

### 선택한 작업
- Memory personal 카테고리 설계 및 테스트 (패치 생성)

### 구현 내용
- 반려동물 이름, 유저 이름/닉네임 추출 패턴 설계
- 10/10 테스트 통과
- 패치파일: `briefings/pickmetalk-memory-personal-20260827.patch`

### PR
- Sun PR: https://github.com/kimeunsun109-debug/sun/pull/15

---

## 2026-08-28

### 선택한 작업
- Memory personal 카테고리 추가 (유저 이름, 반려동물 이름, 가족 이름 추출)

### 선택 이유
- Memory는 관계 경험의 핵심
- "망고 오늘 밥 잘 먹었어?", "민준아 밥은 먹었어?" 같은 자연스러운 회상이 가능해짐
- 전날(08-27) 설계 → 오늘 구현 완료

### 구현 내용
- `services/memory.ts`: `personal` 카테고리 추가 (weight=-1 최우선)
  - 반려동물 이름 추출 (11종 동물, 2가지 패턴)
  - 유저 이름 추출 (직업어 false positive 차단)
  - 가족 이름 추출 (형/언니/엄마 등 11가지 관계)
- `services/context.ts`: `personalFacts` 필드 + 프롬프트 주입
- `scripts/test_personal_memory.mts`: 22개 테스트 케이스

### 해결한 버그
- 없음 (신규 기능)

### 실행 및 테스트
- `npx tsx scripts/test_personal_memory.mts` → **22/22 통과**
- `npx tsc --noEmit` → **0 errors**
- `npm run lint` → **No ESLint warnings or errors**

### 사용자에게 달라지는 점
- 대화에서 이름/반려동물/가족 언급 시 캐릭터가 기억하고 자연스럽게 활용
- 관계의 연속성과 개인화 대폭 향상

### PR
- 패치: `briefings/pickmetalk-personal-memory-20260828.patch`
- Sun PR: 생성 예정

### 남은 문제
- pickmetalk- 레포 write 권한 없음 → 패치파일로 전달
- Vercel 검수 필요

### 다음 추천 작업
1. HomeHero UI 스크린샷 검수 (P0)
2. 가족 이름 추출 패턴 고도화
3. Photo Factory ops 뼈대

---

---

## 2026-08-29

### 선택한 작업
단기기억 완료 감지 로직 개선 (schedule 완료 후 fact 제거)

### 선택 이유
사용자가 "약 먹었어", "병원 갔어", "우산 챙겼어" 등 완료를 표현했을 때 캐릭터가 계속 같은 항목을 챙기는 문제가 대화 품질을 크게 저하시킴. 기존 COMPLETION_PATTERN이 매우 좁아 대부분의 완료 표현을 감지하지 못했음.

### 구현 내용
1. **`services/shortTermMemory.ts`**: COMPLETION_PATTERN에 먹었어/마셨어/갔어/갔다/다녀왔어/다녀왔다/받았어/도착했어/맞았어/됐어/나왔어/만났어/사왔어/해결했어/예약했어/찾았어 등 14종 추가. extractShortTermMemory 억제 임계값 20→12자 조정.
2. **`lib/db/shortTermMemories.ts`**: completeMostRelevantShortTermMemory에 score=0 가드 추가 (false positive 방지). scoreMemory 타입별 동사 보너스 확장.
3. **`services/chatSideEffects.ts`**: 완료 감지 + 신규 추출 동시 처리 (either/or → both). "약 먹었어 내일 병원 가야 해" 같은 복합 메시지 처리 가능.
4. **`services/memory.ts`**: removeCompletedScheduleFromSummary() 신규 추가 — 완료 시 장기기억(memory_summary)에서 연관 schedule 팩트 제거.
5. **`app/api/chat/route.ts`**: 완료 메시지인 경우 removeCompletedScheduleFromSummary 적용 후 updateMemorySummary 실행.

### 해결한 버그
- "약 먹었어" → 완료 미감지 → 캐릭터가 계속 약 챙기는 문제
- "병원 갔어" → 완료 미감지 → 병원 가라고 계속 챙기는 문제
- score=0인 무관한 메모리를 잘못 완료 처리하던 버그

### 실행 및 테스트
- `npx tsx scripts/test_short_term_memory.mts` → 41/41 통과
- `npx tsc --noEmit` → 타입 오류 없음
- `npm run lint` → ESLint 경고 없음

### 사용자에게 달라지는 점
- "약 먹었어", "병원 다녀왔어", "우산 챙겼어" 등 완료 표현 → 캐릭터가 더 이상 같은 항목 반복 챙김 안 함
- 한 메시지에 완료 + 새 일정이 동시에 있으면 두 가지 모두 처리됨
- 장기기억에서도 완료된 일정이 자동 정리되어 더 깔끔한 컨텍스트 유지

### PR
https://github.com/kimeunsun109-debug/pickmetalk-/pull/21

### 남은 문제
- 테스트 계정으로 실제 단기기억 활성화 후 엔드투엔드 검증 필요 (ENABLE_SHORT_TERM_MEMORY 플래그 의존)
- PR #20 (Memory personal 카테고리) 아직 DRAFT — 병합 필요
- 캐릭터 홈 UI Vercel 검수 미완

### 다음 추천 작업
- Emotion 상태 지속성 개선 (같은 감정이 너무 오래 유지되는 경우 자연스럽게 전환)
- 또는 캐릭터별 선제 메시지 다양성 확대 (returnVisit 메시지 풀 확장)

---

## 2026-08-30

### 선택한 작업
- **Emotion 상태 자연스러운 전환 — 재접속 시 감정 완화**

### 선택 이유
- 우선순위 5번 (Emotion) 항목
- 기존에는 유저가 1~3h 부재 후 따뜻하게 돌아와도 캐릭터가 `hurt`/`pouty` 상태로 반응
- "왜 내가 잘못한 것도 없는데 캐릭터가 삐쳐있지?" → 관계 몰입 저하
- 서비스 핵심 경험(실제 사람과 관계 맺는 느낌)과 직접 충돌하는 버그

### 구현 내용
- `services/emotion.ts`
  - `isNegativeOrColdMessage(text)` 헬퍼 추가: COLD_REPLY·BORED 패턴 or 1글자 이하면 true
  - `resolveCharacterEmotion()`: 시간 기반 감정 결정 로직 개선
    - 1~3h 갭 + warm return → `happy` (기존: `hurt`)
    - 3h+ 갭 + warm return → `miss_you` (기존: `pouty`)
    - 냉담 메시지(응/ㅇㅇ/몰라/한 글자 등)는 기존 동작 유지
    - `inferEmotionFromUserMessage` 패턴(사랑해/챗GPT 등)은 여전히 최우선
- `scripts/test_emotion.mts` 신규 생성: 45개 테스트 케이스

### 해결한 버그
- 부재 1~3h 후 warm 복귀 시 `hurt` → `happy`
- 부재 3h+ 후 warm 복귀 시 `pouty` → `miss_you`
- (부재 24h+는 기존과 동일: `miss_you`)

### 실행 및 테스트
- `npx tsx scripts/test_emotion.mts` → 45/45 pass
- `npx tsc --noEmit` → 오류 없음
- `npm run lint` → 경고·오류 없음

### 사용자에게 달라지는 점
- 바빠서 잠시 자리를 비웠다가 "야 오늘 힘들었어ㅠ" 하고 돌아오면
  - 이전: 캐릭터가 삐침(pouty)/서운함(hurt)으로 반응 → 어색하고 억울함
  - 이후: 캐릭터가 그리워하며(miss_you) 또는 반갑게(happy) 반응 → 자연스러운 관계 복귀
- 명백히 차갑게 돌아온 경우(응/ㅇㅇ/몰라 등)는 여전히 감정 적용됨

### PR
- https://github.com/kimeunsun109-debug/pickmetalk-/pull/new/cursor/pickmetalk-3065

### 남은 문제
- `hurt`/`pouty` 감지 메시지(COLD_REPLY_PATTERN)가 시간 갭을 무시하는 것은 의도된 동작이나,
  'ㅇㅇ'으로 돌아온 경우 3h 갭이더라도 `pouty` 대신 `hurt`가 됨 (패턴이 먼저 실행).
  추후 패턴 매칭 후 시간 갭으로 감정 업그레이드 고려 가능.

### 다음 추천 작업
- returnVisit 메시지 풀 확장 (현재 캐릭터별 2~3개 → 5~6개)
- Emotion 다양성: ongoing session에서 happy 단조로움 개선 (excited 간헐 등)
- P0: HomeHero/캐릭터 프로필 Vercel 검수

---

## 2026-08-31

### 선택한 작업
- returnVisit 메시지 풀 확장 (2~3개 → 5~6개) + ongoing session emotion variety (excited 간헐 추가)

### 선택 이유
- 재방문 이벤트는 관계의 연속성을 느끼게 하는 핵심 터치포인트인데, 메시지 수가 2~3개로 부족해 반복 경험 시 단조로움
- 활성 대화 중 감정이 항상 `happy`로 고정되어 대화가 밋밋하게 느껴지는 문제 (백로그 P5)
- 두 개 모두 `lib/returnVisit.ts`와 `services/emotion.ts`만 수정하면 되는 독립적이고 안전한 변경

### 구현 내용

#### `lib/returnVisit.ts`
- 5 캐릭터 × 3 티어 메시지 풀 전체 확장

| 캐릭터 | tier1 | tier2 | tier3 |
|--------|-------|-------|-------|
| 유나 | 3 → 6 | 3 → 6 | 2 → 5 |
| 나린 | 3 → 6 | 2 → 5 | 2 → 5 |
| 윤서 | 2 → 5 | 2 → 5 | 2 → 5 |
| 은하 | 3 → 6 | 2 → 5 | 2 → 5 |
| 지유 | 2 → 6 | 2 → 5 | 2 → 5 |

- 캐릭터 성격 일관성 유지 (유나=따뜻, 나린=츤데레, 윤서=데이터형, 은하=감성적, 지유=활기찬)

#### `services/emotion.ts`
- `pickPositiveEmotion(history)` 헬퍼 추가
- 조건: `ongoingSession && affectionWillIncrease`
- 최근 3개 assistant 메시지에 `excited` 없으면 30% 확률로 `excited` 반환
- 그 외 `happy` (기존 동작 유지)
- 연속 excited 과잉 방지: 최근 1회라도 있으면 항상 `happy`

#### `scripts/test_return_visit.mts`
- 103개 테스트 신규 작성
- 메시지 다양성(30회 샘플 → ≥5종), 필드 완전성, 경계값, excited 비율, 연속 억제

### 해결한 버그
- 없음 (신규 기능 개선)

### 실행 및 테스트
```
npx tsx scripts/test_return_visit.mts → 103 passed / 0 failed
npx tsc --noEmit               → 0 errors
npm run lint                   → No ESLint warnings or errors
```

### 사용자에게 달라지는 점
- 1일·3일·7일 만에 앱을 다시 열면 이전과 다른 인사 메시지를 받을 확률이 크게 높아짐
- 활성 대화 중 호감도가 오르는 맥락에서 캐릭터가 가끔 `excited` 표정을 보여줌 → 대화가 더 생동감 있게 느껴짐

### PR
- https://github.com/kimeunsun109-debug/pickmetalk-/pull/23

### 남은 문제
- excited 확률(30%)이 고정값. 실제 사용자 반응에 따라 캐릭터별 조정 필요 가능
- returnVisit 메시지에 사용자 닉네임 삽입 미구현 (더 개인화 가능)
- eunha / jiyu absenceEvent push 메시지 풀도 동일하게 확장 가능 (현재 4개)

### 다음 추천 작업
- P5: `absenceEvent.ts` push 메시지 풀 확장 (jiyu 모닝/이브닝 4개 → 6개)
- P5: excited 확률을 캐릭터별 config로 분리 (지유 높음, 은하 낮음)
- P3: returnVisit 메시지에 `{nickname}` 삽입 기능
- P0: 캐릭터 프로필·홈 UI Vercel 검수 (HomeHero 스크린샷)

---

## 2026-09-01

### 선택한 작업
AbsenceWelcome 오버레이 UI 연동 + returnVisit 메시지 닉네임 개인화

### 선택 이유
- `AbsenceWelcome` 컴포넌트와 `useAbsenceEvent` 훅이 존재했으나 `ChatScreen`에 연결되지 않아 24h+ 재방문 이벤트가 UI에서 전혀 작동하지 않았음
- 관계 연속성 (Relationship continuity) 우선순위 4번 — 복귀 환영이 없으면 관계가 끊겼다는 느낌을 줌
- 닉네임 개인화는 메시지가 "나에게 하는 말"처럼 느껴지게 함

### 구현 내용
1. **`lib/returnVisit.ts`**
   - `substituteNickname(text, nick?)` 헬퍼 추가
   - `getReturnVisitData(characterId, tier, nickname?)` — nickname 파라미터 추가
   - `{nick}` 자리표시자가 있는 메시지를 nickname 미제공 시 pool에서 자동 제외 (unsubstituted 노출 방지)
   - 캐릭터별 닉네임 개인화 메시지 추가: 유나(+2), 나린(+3), 지유(+4), 은하(+3) — 각 티어별 1개
   - 지유 message pool 확장: tier1(2→4개), tier2(2→4개), tier3(2→4개)

2. **`hooks/useAbsenceEvent.ts`**
   - `nickname?: string | null` 파라미터 추가, `getReturnVisitData`에 전달

3. **`components/chat/ChatScreen.tsx`**
   - `useAbsenceEvent` + `AbsenceWelcome` import 추가
   - `absenceEvent = useAbsenceEvent(lastChatAt, characterId, userNickname)` 호출
   - `absenceDismissed` 상태로 오버레이 dismiss 관리
   - `AbsenceWelcome` 렌더링 조건: `shouldShow && !absenceDismissed && data !== null`

### 해결한 버그
- 24h+ 재방문 시 환영 오버레이가 표시되지 않던 문제 (컴포넌트 존재했으나 미연결)

### 실행 및 테스트
- `npx tsc --noEmit` → 오류 0
- `npm run lint` → 경고·오류 0
- 닉네임 대입 함수: 200회 × 5캐릭터 × 3티어 → 미치환 {nick} 없음, 닉네임 삽입 정상 확인

### 사용자에게 달라지는 점
- 24h 이상 대화 공백 후 채팅 진입 시 캐릭터별 재방문 환영 오버레이 표시
- 닉네임이 설정된 경우 일부 메시지에 이름이 삽입되어 더욱 개인적인 느낌
- 지유 메시지 다양성 2배 향상 (tier당 2개→4개)

### PR
- https://github.com/kimeunsun109-debug/pickmetalk-/pull/24 (예정)

### 남은 문제
- AbsenceWelcome 오버레이 실제 Vercel 환경 QA 필요
- `absenceEvent.shouldShow`가 SSR hydration 이후에만 정확 (클라이언트 측 시간 기반)

### 다음 추천 작업
- AbsenceWelcome 오버레이 Vercel preview QA 및 스크린샷 확인
- excited 확률 캐릭터별 config 분리 (지유 높음, 은하 낮음)
- returnVisit 오버레이에 캐릭터 이미지(hero) 삽입으로 몰입감 강화

---

## 2026-09-04

### 선택한 작업
- Memory: 친구·연인 관계 이름 추출 + 가족 직접 식별 패턴 확장

### 선택 이유
- 현재 메모리 시스템은 `{relation} 이름이 {name}야` 패턴만 지원
- 실제 대화에서는 `형이 준호야`, `민지라는 친구야`, `남자친구 이름이 준서야` 같은 패턴이 훨씬 자주 쓰임
- 사용자의 핵심 인물(친구·연인·가족)을 기억해야 AI가 "이 사람을 알고 있다"는 느낌을 줄 수 있음
- Memory 우선순위 3번 — 기억의 정확성이 관계 몰입도의 핵심

### 구현 내용
1. **`services/memory.ts`**
   - `FRIEND_RELATIONS` 추가: 친구, 베프, 절친, 동생뻘, 선배, 후배
   - `PARTNER_RELATIONS` 추가: 남자친구, 남친, 여자친구, 여친, 애인, 연인
   - `ALL_RELATIONS` 합성 (길이 내림차순 정렬 — 부분 문자열 충돌 방지)
   - `stripNameSuffix()` 헬퍼: `야`·`이야`·`이에요`·`이고`·`인데` 접미사를 가진 이름 포함 방지
   - 가족 확장: `사촌` 추가
   - **패턴 1** (기존 확장): `{relation} 이름이/은/가 {name}야/이야/이에요` → 모든 관계에 적용
   - **패턴 2** (신규): `{name}라는/이라는 {relation}` → "준호라는 친구야"
   - **패턴 3** (신규): `내 {relation}이/가 {name}야/인데` → "내 친구가 민지야"
   - **패턴 4** (신규): `{relation}이/가 {name}야/인데` (짧은 관계어 전용) → "형이 준호야", "친구가 수진이야"

2. **`scripts/test_personal_memory.mts`**
   - 테스트 22개 → 35개 (+13개)
   - 가족 직접 식별 3개, 친구 이름 4개, 연인 이름 4개, 부정형 2개

### 해결한 버그
- `남자친구` 안에서 `친구` 패턴이 먼저 매칭되는 부분 문자열 충돌 (ALL_RELATIONS 길이 내림차순 정렬으로 해결)
- `준서야` → `야` 접미사가 이름에 포함되는 캡처 버그 (`stripNameSuffix` 후처리로 해결)

### 실행 및 테스트
```
npx tsx scripts/test_personal_memory.mts  → 35/35 passed
npx tsx scripts/test_emotion.mts          → 45/45 passed
npx tsx scripts/test_short_term_memory.mts→ 41/41 passed
npx tsc --noEmit                          → 0 errors
npm run lint                              → No ESLint warnings or errors
```

### 사용자에게 달라지는 점
- "형이 준호야" → AI가 형의 이름을 기억
- "민지라는 친구야" → 친구 이름 기억
- "내 친구가 영수야" → 친구 이름 기억
- "남자친구 이름이 준서야" → 연인 이름 기억
- "애인 이름이 태희야" → 연인 이름 기억
- AI가 이름을 알고 있을 때 더 자연스럽게 대화 속에서 회상 가능
- 이전에는 이 패턴들이 모두 hobby/fallback 카테고리로 잘못 분류되거나 누락됨

### PR
- https://github.com/kimeunsun109-debug/pickmetalk-/pull/30

### 남은 문제
- PR #28 (excited 확률 캐릭터별 분리)과 PR #29 (hurt/pouty 임계값)은 아직 미병합
- emotion.ts 관련 두 PR 머지 시 충돌 주의 (#28 먼저 권장)
- AbsenceWelcome Vercel 환경 QA 미완

### 다음 추천 작업
- 메모리 회상 시 이름을 더 자연스럽게 사용하는 프롬프트 보강
- 가족/친구 이름이 있을 때 contextMemoryPrompt에 반영되도록 개선
- PR #28/#29 병합 후 감정 시스템 통합 검증
