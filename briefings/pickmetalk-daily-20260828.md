# PickmeTalk 일일 개발 지시서 — 2026-08-28

## 선택한 작업
**Memory personal 카테고리 추가** — 유저 이름, 반려동물 이름, 가족 이름 추출

## 선택 이유
- Memory는 관계 경험의 핵심. 사용자가 대화에서 이름/반려동물을 알려주면 캐릭터가 기억해야 진짜 관계처럼 느껴짐.
- "망고 오늘 밥 잘 먹었어?", "민준아 밥은 먹었어?" 같은 자연스러운 회상이 가능해짐.
- 전날(08-27) 설계했지만 아직 적용 안 된 핵심 개선사항.

## 구현 내용

### `services/memory.ts`
- `MemoryCategory`에 `"personal"` 추가 (weight=-1 → 최우선)
- `MAX_PERSONAL_MEMORIES = 3` 상수 추가
- 추출 함수 `extractPersonalEntity()` 구현:
  - 반려동물: `"X라는 강아지"`, `"강아지 이름이 X야"` (11종 동물 지원)
  - 유저 이름: `"내 이름은 X야"`, `"X라고 불러/해"` (직업어 필터링)
  - 가족 이름: `"형/언니/엄마 이름이 X야"` (11가지 관계 지원)
- `extractKeyMemories()` 첫 번째로 personal 추출
- `capWithEmotionLimit()` personal 별도 cap (최대 3개)
- `parseStoredEntity()` `[personal]` 태그 파싱 지원
- `getContextMemoryPrompt()` personal은 건너뜀 (contextBlock에서 처리)

### `services/context.ts`
- `UserContextData.personalFacts?: string[]` 필드 추가
- `extractUserContext()`: 메모리에서 personalFacts + 유저 이름 추출
  - 프로필 닉네임 > 메모리 추출 이름 (우선순위 유지)
- `buildCommonContextBlock()`: personal facts 프롬프트 주입
  - `"유저가 알려준 정보: 반려동물: 망고 (강아지) (자연스럽게 활용, 같은 질문 반복 금지)"`

### `scripts/test_personal_memory.mts`
- 22개 테스트 케이스, 전부 통과

## 테스트 결과
```
22 passed, 0 failed
tsc --noEmit: 0 errors
next lint: No ESLint warnings or errors
```

## 사용자에게 달라지는 점
- 대화에서 "내 이름은 민준이야"라고 하면 캐릭터가 그 이름을 기억하고 "민준아~" 하고 부를 수 있음
- "망고라는 강아지가 있어"라고 하면 다음 대화에서 "망고 오늘도 잘 놀았어?" 자연스럽게 물어볼 수 있음
- "형 이름이 민수야"라면 "형 민수씨 잘 지내시지?" 가능
- Personal facts는 모든 턴 프롬프트에 주입 → 대화 흐름이 끊겨도 기억 유지

## 패치 파일
`briefings/pickmetalk-personal-memory-20260828.patch`

## 적용 방법 (로컬에서)
```bash
cd ~/pickmetalk
git am briefings/pickmetalk-personal-memory-20260828.patch
# 또는
git apply briefings/pickmetalk-personal-memory-20260828.patch
```

## 위험 요소
- 없음. 기존 memory_summary 형식 호환 (구 [schedule|hobby|...] 태그 그대로 파싱됨)
- personal은 추가만 되고 기존 카테고리에 영향 없음

## 다음 추천 작업
1. HomeHero UI 스크린샷 Vercel 검수 (P0)
2. 가족 이름 추출 패턴 고도화 (형/언니 + 이름 동시 추출)
3. Photo Factory ops 뼈대 (pickmetalk-ops)
