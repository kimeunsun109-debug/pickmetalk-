# Performance Before / After (실측)

측정 환경: Cursor Cloud VM, `npm run dev -- -p 3001`, `npm run perf:benchmark -- --port 3001`

| 단계 | 브랜치/시점 |
|------|-------------|
| **Before** | `cursor/perf-profiling-e030` @ 2026-07-03T15:18:06Z |
| **After (1차)** | `cursor/perf-optimizations-e030` @ 2026-07-03T15:26:41Z |
| **After (2차)** | migration 007 적용 + zero pre-stream await @ 2026-07-04T03:57:53Z |

## 핵심 지표

| 항목 | Before (ms) | After 1차 (ms) | **After 2차 (ms)** | Δ vs Before | 목표 |
|------|------------:|---------------:|-------------------:|------------:|------|
| **AI Response TTFB (headers)** | 1705 | 912 | **714** | **−991** | ≤800 ✅ |
| AI Response — First SSE chunk | 1712 | 912 | **714** | −998 | — |
| AI Response — Total stream | 5754 | 4149 | 5338 | −416* | — |
| Conversations List SSR | 2215 | 1559 | **1451** | −764 | denormalize ✅ |
| Enter Chat — Messages API** | 2398 | 1459 | 1467 | −931 | SSR skip |
| Enter Chat — Relationship API** | 915 | 862 | 831 | −84 | SSR skip |
| Enter Chat — Proactive API | 1658 | 1513 | 1978 | +320* | non-blocking |
| Enter Chat — SSR HTML (TTFB) | 1543 | 1470 | **722** | −821 | — |

\* 네트워크·LLM 변동으로 실행마다 차이 있음 (실측 3회 중 최종 run 기준).

\** 벤치마크 스크립트는 엔드포인트를 **직접 호출**합니다. 실제 앱은 SSR 하이드레이션 시 Messages/Relationship **클라이언트 재호출 0회** (`ChatProvider` `skipIfHydrated`).

## Migration 007

- **상태**: Supabase SQL Editor 수동 적용 완료 (2026-07-04)
- **검증**: `npx tsx scripts/verify_migration_007.mts` → `last_message_preview`, `last_message_role` 컬럼 조회 OK
- 신규 메시지 전송 시 preview 컬럼 자동 갱신 (`updateConversationLastMessage`)

## 적용 변경 요약

### 1차
1. **AI TTFB**: auth/DB/프롬프트를 `stream.start()`로 이동. `getSession`. 검색·일일패턴 defer. 단기기억 prompt 유지.
2. **Conversations List**: `fetchLastMessagePreviews` 제거 → denormalized 컬럼
3. **SSR 중복 fetch** / **Proactive 백그라운드** / **BugBot** 수정

### 2차 (migration 적용 후)
1. **AI TTFB**: `request.json()` 포함 **모든 pre-stream await 제거** → 즉시 SSE Response
2. preview 갱신을 migration 컬럼에 **동기 반영** (best-effort `.catch` 제거)

## Raw JSON

- Before: `perf/benchmark-before-optimizations.json`
- After 1차: `perf/benchmark-after-optimizations.json`
- After 2차: `perf/benchmark-2026-07-04-03-58-18.json`
