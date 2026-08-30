# PickMeTalk Daily Dev Log

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
