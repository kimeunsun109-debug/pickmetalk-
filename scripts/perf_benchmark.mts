#!/usr/bin/env npx tsx
/**
 * PickmeTalk E2E 성능 벤치마크 — 수정 없이 측정만
 * Usage: PERF_TRACE=1 npm run dev  (별 터미널)
 *        npx tsx scripts/perf_benchmark.mts [--port 3001]
 */
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

const ROOT = resolve(import.meta.dirname, "..");

function loadEnv(): Record<string, string> {
  const env: Record<string, string> = { ...process.env } as Record<string, string>;
  const path = resolve(ROOT, ".env.local");
  if (!existsSync(path)) return env;
  for (const line of readFileSync(path, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#") || !t.includes("=")) continue;
    const eq = t.indexOf("=");
    env[t.slice(0, eq).trim()] = t
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
  }
  return env;
}

type Timed = { name: string; ms: number; category: string; detail?: string };

async function timedFetch(
  name: string,
  category: string,
  url: string,
  init?: RequestInit
): Promise<{ ms: number; status: number; body?: string; firstByteMs?: number }> {
  const t0 = performance.now();
  const res = await fetch(url, init);
  const firstByteMs = Math.round(performance.now() - t0);
  const body = await res.text();
  const totalMs = Math.round(performance.now() - t0);
  return { ms: totalMs, status: res.status, body, firstByteMs };
}

async function timedChatStream(
  base: string,
  cookieHeader: string,
  conversationId: string,
  message: string
): Promise<{
  ttfbMs: number;
  firstChunkMs: number;
  totalMs: number;
  promptMeta?: string;
}> {
  const t0 = performance.now();
  const res = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify({ conversationId, message }),
  });
  const ttfbMs = Math.round(performance.now() - t0);

  if (!res.ok || !res.body) {
    throw new Error(`chat ${res.status}: ${await res.text()}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let firstChunkMs = 0;
  let gotContent = false;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (!gotContent) {
      firstChunkMs = Math.round(performance.now() - t0);
      gotContent = true;
    }
    buffer += decoder.decode(value, { stream: true });
  }

  const totalMs = Math.round(performance.now() - t0);
  return { ttfbMs, firstChunkMs: gotContent ? firstChunkMs : totalMs, totalMs };
}

async function buildCookieHeader(env: Record<string, string>): Promise<string> {
  const url = env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const email = env.TEST_USER_EMAIL ?? "demo.tester@pickmetalk.dev";
  const password = env.TEST_USER_PASSWORD ?? "DemoPass123!";

  const browser = createClient(url, anon);
  const { data: auth, error } = await browser.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !auth.session) throw new Error(error?.message ?? "login fail");

  const jar: { name: string; value: string }[] = [];
  const server = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return jar;
      },
      setAll(cookies) {
        for (const c of cookies) {
          const i = jar.findIndex((x) => x.name === c.name);
          if (!c.value) {
            if (i >= 0) jar.splice(i, 1);
          } else if (i >= 0) jar[i] = { name: c.name, value: c.value };
          else jar.push({ name: c.name, value: c.value });
        }
      },
    },
  });
  await server.auth.setSession({
    access_token: auth.session.access_token,
    refresh_token: auth.session.refresh_token,
  });
  return jar.map((c) => `${c.name}=${c.value}`).join("; ");
}

async function checkJournalTable(env: Record<string, string>): Promise<Timed | null> {
  const service = env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  if (!service || !supabaseUrl) return null;

  const t0 = performance.now();
  const res = await fetch(
    `${supabaseUrl}/rest/v1/chat_voice_journal?select=id&limit=20`,
    {
      headers: {
        apikey: service,
        Authorization: `Bearer ${service}`,
      },
    }
  );
  const ms = Math.round(performance.now() - t0);
  const status =
    res.status === 404
      ? "테이블 없음 (이 브랜치)"
      : res.ok
        ? "OK"
        : `HTTP ${res.status}`;
  return {
    name: "Journal REST 조회 (chat_voice_journal)",
    ms,
    category: "Supabase",
    detail: status,
  };
}

function printSection(title: string, lines: Timed[], totalLabel = "총합") {
  console.log(`\n[${title}]`);
  console.log("start");
  let sum = 0;
  for (const line of lines) {
    console.log(`\n${line.name}`);
    console.log(`${line.ms}ms${line.detail ? ` — ${line.detail}` : ""}`);
    sum += line.ms;
  }
  console.log(`\n${totalLabel}`);
  console.log(`${sum}ms`);
  console.log("----------------");
  return sum;
}

interface RankedItem {
  rank: number;
  name: string;
  ms: number;
  category: string;
  cause: string;
  fix: string;
  expectedSavingMs: number;
}

function buildTop10(all: Timed[]): RankedItem[] {
  const sorted = [...all].sort((a, b) => b.ms - a.ms).slice(0, 10);

  const causeMap: Record<string, { cause: string; fix: string; saving: number }> = {
    "AI Response — First SSE chunk": {
      cause:
        "스트림 시작 전 DB 5건 병렬 조회 + 프롬프트 빌드 + DeepSeek TTFB. 외부 LLM RTT가 지배적.",
      fix: "프롬프트 축소·캐시, 검색/패턴 defer, 더 빠른 모델/리전",
      saving: Math.round((sorted.find((s) => s.name.includes("First SSE"))?.ms ?? 0) * 0.4),
    },
    "AI Response — Total stream": {
      cause: "DeepSeek 토큰 생성 + 스트림 완료까지 전체 시간",
      fix: "max_tokens 제한, 짧은 답변 유도, 스트리밍 청크 버퍼 최적화",
      saving: Math.round((sorted.find((s) => s.name.includes("Total"))?.ms ?? 0) * 0.25),
    },
    "Enter Chat — SSR HTML (TTFB)": {
      cause:
        "force-dynamic SSR: getUser + 대화방 resolve + touchSelection + messages 50건 + React render",
      fix: "RSC 캐시, 메시지 페이지네이션, 병렬화 유지·쿼리 인덱스",
      saving: Math.round((sorted.find((s) => s.name.includes("SSR"))?.ms ?? 0) * 0.5),
    },
    "Enter Chat — Proactive API": {
      cause:
        "runProactiveMessageFlow: 대화·UCS·absence·last message 조회 + 조건부 insert",
      fix: "최근 메시지 있으면 skip, 백그라운드만 유지(이미 적용), 쿨다운 단축",
      saving: Math.round((sorted.find((s) => s.name.includes("Proactive"))?.ms ?? 0) * 0.6),
    },
    "Enter Chat — Messages API": {
      cause: "getUser + getConversationForUser + messages select (최대 60건)",
      fix: "SSR 하이드레이션 시 클라이언트 재호출 제거, limit 30",
      saving: Math.round((sorted.find((s) => s.name.includes("Messages API"))?.ms ?? 0) * 0.7),
    },
    "Middleware — getUser (per navigation)": {
      cause: "모든 라우트에서 Supabase auth.getUser() 1 RTT",
      fix: "세션 JWT 로컬 검증, 보호 라우트만 갱신",
      saving: Math.round((sorted.find((s) => s.name.includes("Middleware"))?.ms ?? 0) * 0.5),
    },
    "Home Load": {
      cause: "force-dynamic + getUser SSR",
      fix: "정적 셸 + 클라이언트 세션",
      saving: Math.round((sorted.find((s) => s.name.includes("Home"))?.ms ?? 0) * 0.4),
    },
    "Conversations List SSR": {
      cause: "대화 목록 + fetchLastMessagePreviews (messages in 쿼리)",
      fix: "last_message_at 컬럼 denormalize, preview limit",
      saving: Math.round((sorted.find((s) => s.name.includes("Conversations"))?.ms ?? 0) * 0.55),
    },
    "Relationship API": {
      cause: "getUser + conversation + UCS 조회",
      fix: "SSR 초기값으로 중복 fetch 제거",
      saving: Math.round((sorted.find((s) => s.name.includes("Relationship"))?.ms ?? 0) * 0.8),
    },
    "Characters Page SSR": {
      cause: "getUser + active character DB",
      fix: "캐시·병렬",
      saving: Math.round((sorted.find((s) => s.name.includes("Characters"))?.ms ?? 0) * 0.35),
    },
  };

  return sorted.map((item, i) => {
    const hint = causeMap[item.name] ?? {
      cause: "네트워크 RTT + Supabase/Next.js SSR 오버헤드",
      fix: "프로파일링 후 해당 구간 최적화",
      saving: Math.round(item.ms * 0.3),
    };
    return {
      rank: i + 1,
      name: item.name,
      ms: item.ms,
      category: item.category,
      cause: hint.cause,
      fix: hint.fix,
      expectedSavingMs: hint.saving,
    };
  });
}

async function main() {
  const env = loadEnv();
  const port = process.argv.includes("--port")
    ? process.argv[process.argv.indexOf("--port") + 1]
    : "3001";
  const base = `http://localhost:${port}`;

  console.log("=== PickmeTalk Performance Benchmark ===");
  console.log(`target: ${base}`);
  console.log(`time: ${new Date().toISOString()}\n`);

  const allTimings: Timed[] = [];

  // Health
  try {
    const ping = await timedFetch("Health", "infra", `${base}/login`);
    if (ping.status !== 200) throw new Error(`login page ${ping.status}`);
  } catch (e) {
    console.error("Dev server not reachable. Run: npm run dev -- -p", port);
    process.exit(1);
  }

  const cookie = await buildCookieHeader(env);
  const cookieInit = { headers: { Cookie: cookie } };

  // Home
  const home = await timedFetch("Home", "page", `${base}/`, cookieInit);
  allTimings.push({
    name: "Home Load",
    ms: home.ms,
    category: "SSR",
    detail: `HTTP ${home.status}, TTFB ~${home.firstByteMs}ms`,
  });
  printSection("Home Load", [allTimings[allTimings.length - 1]]);

  // Characters
  const chars = await timedFetch("Characters", "page", `${base}/characters`, cookieInit);
  allTimings.push({
    name: "Characters Page SSR",
    ms: chars.ms,
    category: "SSR",
    detail: `TTFB ~${chars.firstByteMs}ms`,
  });

  // Conversations
  const convList = await timedFetch(
    "Conversations",
    "page",
    `${base}/conversations`,
    cookieInit
  );
  allTimings.push({
    name: "Conversations List SSR",
    ms: convList.ms,
    category: "SSR",
    detail: `TTFB ~${convList.firstByteMs}ms`,
  });

  // Settings
  const settings = await timedFetch("Settings", "page", `${base}/settings`, cookieInit);
  allTimings.push({
    name: "Settings Page SSR",
    ms: settings.ms,
    category: "SSR",
    detail: `TTFB ~${settings.firstByteMs}ms`,
  });

  // Create / get conversation
  const convRes = await fetch(`${base}/api/conversations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ characterId: "yuna" }),
  });
  const convBody = (await convRes.json()) as { conversation?: { id: string } };
  const conversationId = convBody.conversation?.id;
  if (!conversationId) throw new Error("conversation create failed");

  // Chat SSR
  const chatSsr = await timedFetch(
    "Chat SSR",
    "page",
    `${base}/chat/yuna?conversationId=${conversationId}`,
    cookieInit
  );
  allTimings.push({
    name: "Enter Chat — SSR HTML (TTFB)",
    ms: chatSsr.firstByteMs ?? chatSsr.ms,
    category: "Enter Chat",
    detail: `full ${chatSsr.ms}ms`,
  });

  const enterChatLines: Timed[] = [];

  const charLoad = await timedFetch(
    "Load Character (in-memory)",
    "Enter Chat",
    `${base}/api/characters`,
    cookieInit
  );
  enterChatLines.push({
    name: "Load Character — API",
    ms: charLoad.ms,
    category: "API",
  });

  const msgApi = await timedFetch(
    "Messages",
    "Enter Chat",
    `${base}/api/messages?conversationId=${conversationId}`,
    cookieInit
  );
  enterChatLines.push({
    name: "Enter Chat — Messages API",
    ms: msgApi.ms,
    category: "Supabase",
    detail: `HTTP ${msgApi.status}`,
  });
  allTimings.push(enterChatLines[enterChatLines.length - 1]);

  const relApi = await timedFetch(
    "Relationship",
    "Enter Chat",
    `${base}/api/relationship?conversationId=${conversationId}`,
    cookieInit
  );
  enterChatLines.push({
    name: "Enter Chat — Relationship API",
    ms: relApi.ms,
    category: "Supabase",
  });
  allTimings.push(enterChatLines[enterChatLines.length - 1]);

  const proactiveApi = await timedFetch(
    "Proactive",
    "Enter Chat",
    `${base}/api/conversations/${conversationId}/proactive`,
    { method: "POST", headers: { Cookie: cookie } }
  );
  enterChatLines.push({
    name: "Enter Chat — Proactive API",
    ms: proactiveApi.ms,
    category: "Supabase",
    detail: `HTTP ${proactiveApi.status}`,
  });
  allTimings.push(enterChatLines[enterChatLines.length - 1]);

  const journal = await checkJournalTable(env);
  if (journal) {
    enterChatLines.push(journal);
    allTimings.push(journal);
  }

  enterChatLines.push({
    name: "Enter Chat — SSR HTML (TTFB)",
    ms: chatSsr.firstByteMs ?? chatSsr.ms,
    category: "SSR",
  });

  printSection("Enter Chat", enterChatLines);

  // Middleware estimate: auth on one API call (duplicate getUser)
  allTimings.push({
    name: "Middleware — getUser (per navigation)",
    ms: Math.round((home.firstByteMs ?? 50) * 0.15),
    category: "Auth",
    detail: "추정: TTFB의 ~15% (실측은 서버 PERF_TRACE 필요)",
  });

  // AI Response
  const testMsg = `perf-bench-${Date.now()} 오늘 날씨 어때?`;
  const stream = await timedChatStream(base, cookie, conversationId, testMsg);

  const aiLines: Timed[] = [
    {
      name: "AI Response — TTFB (headers)",
      ms: stream.ttfbMs,
      category: "AI",
      detail: "pre-stream await 없이 SSE headers 반환",
    },
    {
      name: "AI Response — First SSE chunk",
      ms: stream.firstChunkMs,
      category: "AI",
      detail: "첫 토큰/폴백까지",
    },
    {
      name: "AI Response — Total stream",
      ms: stream.totalMs,
      category: "AI",
    },
  ];
  allTimings.push(...aiLines);
  printSection("AI Response", aiLines);

  // LocalStorage (client-only — documented)
  console.log("\n[Client-only — run in browser DevTools]");
  console.log("LocalStorage read/write: 측정하려면 NEXT_PUBLIC_PERF_TRACE=1 + 앱 사용");
  console.log("React re-render: ChatProvider/ChatScreen 콘솔 [Render] 로그");
  console.log("Long Task / Network: Chrome Performance·Network 탭 수동 확인");

  const top10 = buildTop10(allTimings);

  console.log("\n\n========================================");
  console.log("① 가장 오래 걸리는 작업 TOP10");
  console.log("========================================\n");

  for (const item of top10) {
    console.log(`${item.rank}위`);
    console.log(item.name);
    console.log(`${item.ms}ms`);
    console.log(`\n③ 왜 느린지\n${item.cause}`);
    console.log(`\n④ 해결 방법\n${item.fix}`);
    const after = Math.max(0, item.ms - item.expectedSavingMs);
    console.log(
      `\n⑤ 해결 시 예상 감소\n${item.ms}ms → ${after}ms (−${item.expectedSavingMs}ms)\n`
    );
    console.log("---");
  }

  const reportDir = resolve(ROOT, "perf");
  mkdirSync(reportDir, { recursive: true });
  const reportPath = resolve(
    reportDir,
    `benchmark-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`
  );
  writeFileSync(
    reportPath,
    JSON.stringify({ capturedAt: new Date().toISOString(), allTimings, top10 }, null, 2)
  );
  console.log(`\nRaw data: ${reportPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
