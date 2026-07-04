# Performance Before / After (실측)

측정 환경: Cursor Cloud VM, `npm run dev -- -p 3001`, `npm run perf:benchmark -- --port 3001`

| 단계 | 브랜치/시점 |
|------|-------------|
| **Before** | `cursor/perf-profiling-e030` @ 2026-07-03T15:18:06Z |
| **After (1차)** | `cursor/perf-optimizations-e030` @ 2026-07-03T15:26:41Z |
| **After (2차)** | migration 007 적용 + zero pre-stream await @ 2026-07-04T03:57:53Z |
| **After (3차)** | proactive fast-path + backfill @ 2026-07-04T04:02:02Z |

## 핵심 지표

| 항목 | Before (ms) | After 2차 (ms) | **After 3차 (ms)** | Δ vs Before | 목표 |
|------|------------:|---------------:|-------------------:|------------:|------|
| **AI Response TTFB (headers)** | 1705 | 714 | **837** | −868 | ≤800 (~변동) |
| AI Response — Total stream | 5754 | 5338 | **4766** | −988 | — |
| Conversations List SSR | 2215 | 1451 | **1616** | −599 | denormalize ✅ |
| **Enter Chat — Proactive API** | 1658 | 1978 | **688** | **−970** | non-blocking ✅ |
| Enter Chat — SSR HTML (TTFB) | 1543 | 722 | **749** | −794 | — |

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
2. preview 갱신을 migration 컬럼에 **동기 반영**

### 3차
1. **Proactive fast-path**: `lastMessageRole=user` / `recent_activity`(<3h) / `no_history` 즉시 skip
2. **Denormalized skip**: `shouldSkipProactiveFromConversation` — messages 조회 생략
3. **Proactive auth**: `getSession` (getUser 제거)
4. **Backfill**: `scripts/backfill_conversation_previews.mts` (메시지 있는 대화는 이미 preview 보유)

## Raw JSON

- Before: `perf/benchmark-before-optimizations.json`
- After 2차: `perf/benchmark-after-migration.json`
- After 3차: `perf/benchmark-2026-07-04-04-02-24.json`
