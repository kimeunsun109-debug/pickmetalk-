# PickmeTalk 일일 개발 로그

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

## 2026-08-27

### 선택한 작업
- Memory personal 카테고리 설계 및 테스트 (패치 생성)

### 구현 내용
- 반려동물 이름, 유저 이름/닉네임 추출 패턴 설계
- 10/10 테스트 통과
- 패치파일: `briefings/pickmetalk-memory-personal-20260827.patch`

### PR
- Sun PR: https://github.com/kimeunsun109-debug/sun/pull/15
