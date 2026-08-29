# PickMeTalk Daily Development Log

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
