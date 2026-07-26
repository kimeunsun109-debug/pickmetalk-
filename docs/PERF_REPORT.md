# PickmeTalk 성능 측정 보고서

측정일: 2026-07-03 (Cursor Cloud VM → `localhost:3001` → Supabase hosted + DeepSeek API)

**수정 없음 — 관측만 수행.** 재측정: `npm run perf:benchmark -- --port 3001`  
서버 상세 로그: `PERF_TRACE=1 npm run dev` 후 콘솔에 `[AI Response]` / `[Enter Chat — SSR]` 블록 출력

---

## 측정 방법

| 계층 | 도구 |
|------|------|
| E2E API·SSR | `scripts/perf_benchmark.mts` (HTTP TTFB·스트림) |
| 서버 단계 | `lib/perf/trace.ts` + `PERF_TRACE=1` |
| 클라이언트 | `NEXT_PUBLIC_PERF_TRACE=1` → `[Render] ChatProvider` 로그 |
| Network / Long Task | Chrome DevTools (로컬 브라우저 수동) |
| Supabase Dashboard | Query Performance (수동) |

---

## ① 가장 오래 걸리는 작업 TOP10 (실측)

| 순위 | 작업 | ms | 비고 |
|------|------|-----|------|
| 1 | AI Response — Total stream | **6128** | DeepSeek 토큰 생성 전체 |
| 2 | Settings Page SSR | **2442** | 4개 DB 쿼리 SSR |
| 3 | Conversations List SSR | **2134** | 목록 + preview messages |
| 4 | AI Response — First SSE chunk* | **2042** | *아래 주의 |
| 5 | AI Response — TTFB (headers) | **2038** | 스트림 열기 전 동기 작업 |
| 6 | Enter Chat — Proactive API | **1974** | 선제 메시지 플로우 |
| 7 | Characters Page SSR | **1913** | getUser + UCS |
| 8 | Enter Chat — Messages API | **1588** | getUser + messages 60건 |
| 9 | Home Load | **1374** | force-dynamic + getUser |
| 10 | Enter Chat — Relationship API | **1275** | 호감도 상태 |

\*첫 SSE 청크에 `{ streaming: true }` 하트비트가 포함되어 **실제 LLM 첫 글자보다 빠르게 잡힐 수 있음.** 체감 `...` 시간은 **TTFB(2038ms) + DB병렬·프롬프트·DeepSeek 첫 토큰** 합.

**Journal (`chat_voice_journal`)**: 243ms — 이 브랜치 채팅 경로에서 **매 턴 조회하지 않음** (병목 아님).

---

## ②③④⑤ 항목별 상세

### 1위 — AI Total stream (6128ms)

- **왜 느린지**: DeepSeek `api.deepseek.com` 토큰 생성이 대부분. 스트림 본문 ~4090ms (6128−2038).
- **해결**: `max_tokens` 상한, 답변 길이 프롬프트, 필요 시 더 빠른 모델.
- **예상**: 6128ms → **~4600ms** (−1500ms)

### 2위 — Settings SSR (2442ms)

- **왜 느린지**: `getUser` + profiles + UCS + messages count + session_logs (직렬·병렬 혼합), `force-dynamic`.
- **해결**: 통계 API 분리·클라이언트 lazy load, 정적 셸.
- **예상**: 2442ms → **~1700ms** (−730ms)

### 3위 — Conversations List SSR (2134ms)

- **왜 느린지**: `fetchLastMessagePreviews`가 conversations마다 messages 스캔 (limit 있으나 여전히 무거움).
- **해결**: `last_message_preview` 컬럼 denormalize, SQL `DISTINCT ON`.
- **예상**: 2134ms → **~960ms** (−1170ms)

### 4·5위 — AI TTFB 2038ms + 첫 청크

- **왜 느린지** (스트림 **열리기 전** 동기 구간):
  - `auth.getUser()` ~200–400ms
  - `getConversationForUser` ~300–500ms
  - user message `insert` ~400–800ms  
  스트림 시작 후: profiles + history 40건 + UCS + Tavily(최대 1.2s) + daily patterns + prompt build + DeepSeek TTFT.
- **해결**: pre-stream insert를 스트림 내부로 defer, getUser 1회화, 프롬프트 축소, 검색 완전 비동기.
- **예상**: 체감 첫 글자 **2038ms → ~800ms** (−1200ms)

### 6위 — Proactive API (1974ms)

- **왜 느린지**: `runProactiveMessageFlow` — conversation, UCS, absence, last message, 조건부 insert (4–6 Supabase RTT). Cloud→Supabase RTT ~300–600ms/호출.
- **해결**: 최근 대화 있으면 즉시 skip (쿨다운 강화), SSR 진입 시 호출 안 함.
- **예상**: 1974ms → **~790ms** (백그라운드 유지 시 체감 0ms)

### 7위 — Characters SSR (1913ms)

- **왜 느린지**: middleware `getUser` + page `getUser` + active character DB.
- **해결**: 세션 캐시, 페이지 data cache.
- **예상**: 1913ms → **~1240ms** (−670ms)

### 8위 — Messages API (1588ms)

- **왜 느린지**: 요청마다 `getUser` + ownership check + up to 60 messages. SSR 후 **중복 호출** 가능.
- **해결**: SSR hydration 완료 시 클라이언트 fetch 생략 (부분 적용됨), limit 30.
- **예상**: 1588ms → **~480ms** (−1110ms)

### 9위 — Home Load (1374ms)

- **왜 느린지**: `force-dynamic` + SSR `getUser`, TTFB ~1364ms.
- **해결**: 정적 랜딩 + 클라이언트 세션.
- **예상**: 1374ms → **~820ms** (−550ms)

### 10위 — Relationship API (1275ms)

- **왜 느린지**: getUser + conversation + UCS. SSR 초기값과 중복.
- **해결**: SSR에서 relationship 포함 후 클라이언트 skip.
- **예상**: 1275ms → **~890ms** (−385ms)

---

## 홈 → 채팅방 진입 (사용자 시나리오 합산)

| 단계 | 실측 (순차 벤치) | 실제 앱 (병렬) |
|------|------------------|----------------|
| Home SSR | 1374ms | 1374ms |
| Chat SSR TTFB | 468ms | 468ms |
| Messages + Relationship + Proactive | 4837ms (합) | **~1974ms** (max 병렬) |
| **체감 합** | — | **~2400–3500ms** (SSR 메시지 hydrate 시 Messages skip) |

PR #4(로딩 개선) 미머지/미배포 환경에서는 **중복 API 호출**로 더 느릴 수 있음.

---

## 추가 분석 (수동)

| 항목 | 상태 |
|------|------|
| React Re-render | `NEXT_PUBLIC_PERF_TRACE=1` 시 `ChatProvider`/`ChatScreen` 콘솔 카운트 |
| Long Task | Chrome Performance → Main thread 50ms+ (로컬 녹화 영상 권장) |
| Network slow API | 벤치마크 기준 **모든 `/api/*` 1.2–2.0s** — Supabase RTT 지배 |
| Supabase Dashboard | messages·conversations 인덱스 확인 권장 (`conversation_id`, `user_id`) |
| Prompt 길이 | `PERF_TRACE=1` 채팅 시 `Prompt length N chars` 서버 로그 |
| LocalStorage | 현재 핫패스 미사용 (무시) |
| Image Load | `/assets/characters/*.jpg` 404 시 fallback — Network 탭 확인 |

---

## 인스트루멘테이션 파일

- `lib/perf/trace.ts` — ServerPerfTrace / PerfTrace
- `lib/perf/client.ts` — usePerfRenderCount
- `scripts/perf_benchmark.mts` — E2E 보고서 생성
- `perf/benchmark-*.json` — raw 데이터

**수정은 사용자 승인 후 진행.**
