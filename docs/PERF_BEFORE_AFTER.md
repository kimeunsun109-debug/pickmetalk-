# Performance Before / After (실측)

측정 환경: Cursor Cloud VM, `npm run dev -- -p 3001`, `npm run perf:benchmark -- --port 3001`  
Before: `cursor/perf-profiling-e030` @ 2026-07-03T15:18:06Z (최적화 직전)  
After: `cursor/perf-optimizations-e030` @ 2026-07-03T15:26:41Z (최적화 적용 후)

## 핵심 지표

| 항목 | Before (ms) | After (ms) | Δ (ms) | 목표 |
|------|------------:|-----------:|-------:|------|
| **AI Response TTFB (headers)** | 1705 | **912** | **−793** | ≤800 (미달 +112) |
| AI Response — First SSE chunk | 1712 | 912 | −800 | — |
| AI Response — Total stream | 5754 | 4149 | −1605 | — |
| Conversations List SSR | 2215 | 1559 | −656 | denormalize |
| Enter Chat — Messages API* | 2398 | 1459 | −939 | SSR skip |
| Enter Chat — Relationship API* | 915 | 862 | −53 | SSR skip |
| Enter Chat — Proactive API | 1658 | 1513 | −145 | non-blocking |
| Enter Chat — SSR HTML (TTFB) | 1543 | 1470 | −73 | — |

\* 벤치마크 스크립트는 엔드포인트를 **직접 호출**합니다. 실제 앱은 SSR 하이드레이션 시 Messages/Relationship **클라이언트 재호출 0회** (`ChatProvider` `skipIfHydrated`).

Raw JSON:
- Before: `perf/benchmark-2026-07-03-15-18-34.json`
- After: `perf/benchmark-2026-07-03-15-27-05.json`

## 적용 변경 요약

1. **AI TTFB**: pre-stream을 body 파싱만 남기고 auth/DB/프롬프트를 `stream.start()`로 이동. `getUser` → `getSession`. 검색·일일패턴 hot path 제거. 단기기억은 prompt에 유지.
2. **Conversations List**: `fetchLastMessagePreviews` 제거 → `conversations.last_message_preview` 컬럼 사용 (migration `007_conversation_preview.sql`).
3. **SSR 중복 fetch**: `ssrMessagesHydratedRef` / `ssrRelationshipHydratedRef`로 Messages·Relationship API 스킵.
4. **Proactive**: `runProactiveInBackground` — 채팅 진입 blocking 없음, 스트리밍 중 `mergeNewServerMessages`로 덮어쓰기 방지.
5. **BugBot**: 스트리밍 중 bubble 분할 금지, `userMessageId` SSE 전달·클라이언트 id 교체.

## Migration

`supabase/migrations/007_conversation_preview.sql` — Supabase SQL Editor에서 수동 적용 필요 (Cloud VM에서 DDL 자동 실행 불가).
