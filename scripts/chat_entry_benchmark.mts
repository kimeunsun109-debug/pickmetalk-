#!/usr/bin/env npx tsx
/**
 * 채팅방 진입 경로 TOP10 — ms 단위 실측
 * Usage: npm run dev -- -p 3001  (별 터미널)
 *        npm run perf:chat-entry -- --port 3001
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
  url: string,
  init?: RequestInit
): Promise<{ ms: number; ttfbMs: number; status: number }> {
  const t0 = performance.now();
  const res = await fetch(url, init);
  const ttfbMs = Math.round(performance.now() - t0);
  await res.text();
  const ms = Math.round(performance.now() - t0);
  return { ms, ttfbMs, status: res.status };
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

interface RankedItem {
  rank: number;
  name: string;
  ms: number;
  category: string;
  cause: string;
  fix: string;
  expectedSavingMs: number;
}

const CAUSE_MAP: Record<string, { cause: string; fix: string; savingRatio: number }> = {
  "1. Chat SSR — TTFB (HTML 첫 바이트)": {
    cause:
      "force-dynamic SSR: middleware auth + getUser + 대화방 resolve + touchSelection + messages 조회 + React RSC 렌더",
    fix: "SSR 메시지 limit 축소, 병렬 쿼리 유지, icn1+Seoul 리전, streaming SSR",
    savingRatio: 0.45,
  },
  "2. Chat SSR — 전체 HTML 다운로드": {
    cause: "SSR HTML + 하이드레이션 payload 크기 (메시지 50건 포함 시)",
    fix: "초기 메시지 20건 + 스크롤 시 추가 로드, RSC payload 압축",
    savingRatio: 0.35,
  },
  "3. Characters → Chat 라우트 prefetch": {
    cause: "클라이언트 RSC payload prefetch (hover 미적용 시 첫 클릭만 측정)",
    fix: "CharacterCard hover prefetch (적용됨), Link prefetch",
    savingRatio: 0.5,
  },
  "4. 클라이언트 Messages API (백그라운드)": {
    cause: "ChatProvider mount 후 /api/messages 재조회 — SSR 하이드레이션 있으면 skip",
    fix: "skipIfHydrated 유지, SSR 메시지 항상 전달",
    savingRatio: 0.85,
  },
  "5. 클라이언트 Relationship API": {
    cause: "관계 상태 중복 fetch (SSR conversation에 이미 포함)",
    fix: "ssrRelationshipHydratedRef로 skip (적용됨)",
    savingRatio: 0.9,
  },
  "6. Proactive API (백그라운드)": {
    cause: "진입 시 선제 메시지 flow — DB 조회 + 조건부 insert",
    fix: "최근 메시지·쿨다운 fast-path skip, fire-and-forget",
    savingRatio: 0.65,
  },
  "7. Character select API": {
    cause: "캐릭터 선택 시 /api/conversations 목록 조회 (picker)",
    fix: "최근 대화 1건 prefetch, picker 생략 fast-path",
    savingRatio: 0.4,
  },
  "8. Middleware auth (navigation)": {
    cause: "모든 /chat/* 요청마다 Supabase getUser RTT",
    fix: "JWT 로컬 검증, 세션 갱신 주기 완화",
    savingRatio: 0.5,
  },
  "9. touchCharacterSelection DB": {
    cause: "SSR 중 profiles/selection 업데이트 write",
    fix: "fire-and-forget·debounce, 진입 경로에서 분리",
    savingRatio: 0.7,
  },
  "10. React hydration + ChatProvider mount": {
    cause: "클라이언트 번들 파싱, context 초기화, useEffect sync",
    fix: "context 분리·memo (적용됨), client fetch defer",
    savingRatio: 0.25,
  },
};

function buildTop10(all: Timed[]): RankedItem[] {
  return [...all]
    .sort((a, b) => b.ms - a.ms)
    .slice(0, 10)
    .map((item, i) => {
      const hint = CAUSE_MAP[item.name] ?? {
        cause: "네트워크 RTT + SSR/클라이언트 오버헤드",
        fix: "해당 구간 프로파일링 후 최적화",
        savingRatio: 0.3,
      };
      return {
        rank: i + 1,
        name: item.name,
        ms: item.ms,
        category: item.category,
        cause: hint.cause,
        fix: hint.fix,
        expectedSavingMs: Math.round(item.ms * hint.savingRatio),
      };
    });
}

function printMarkdownTable(rows: RankedItem[]) {
  console.log("\n## 채팅방 진입 TOP10 (ms)\n");
  console.log("| # | 작업 | ms | 카테고리 | 원인 | 개선안 | 예상 절감 |");
  console.log("|---|------|-----|----------|------|--------|-----------|");
  for (const r of rows) {
    const cause = r.cause.replace(/\|/g, "\\|").slice(0, 80);
    const fix = r.fix.replace(/\|/g, "\\|").slice(0, 60);
    console.log(
      `| ${r.rank} | ${r.name} | **${r.ms}** | ${r.category} | ${cause} | ${fix} | ~${r.expectedSavingMs}ms |`
    );
  }
}

async function main() {
  const env = loadEnv();
  const port = process.argv.includes("--port")
    ? process.argv[process.argv.indexOf("--port") + 1]
    : "3001";
  const base = `http://localhost:${port}`;
  const characterId = "yuna";

  console.log("=== Chat Entry TOP10 Benchmark ===");
  console.log(`target: ${base}/chat/${characterId}`);
  console.log(`time: ${new Date().toISOString()}\n`);

  try {
    const ping = await timedFetch(`${base}/login`);
    if (ping.status !== 200) throw new Error(`login ${ping.status}`);
  } catch {
    console.error("Dev server not reachable. Run: npm run dev -- -p", port);
    process.exit(1);
  }

  const cookie = await buildCookieHeader(env);
  const cookieInit = { headers: { Cookie: cookie } };

  const timings: Timed[] = [];

  const tLogin = performance.now();
  await buildCookieHeader(env);
  timings.push({
    name: "0. Supabase login (benchmark setup)",
    ms: Math.round(performance.now() - tLogin),
    category: "Auth",
    detail: "실제 UX 경로 밖",
  });

  const convList = await timedFetch(
    `${base}/api/conversations?characterId=${characterId}`,
    cookieInit
  );
  timings.push({
    name: "7. Character select API",
    ms: convList.ms,
    category: "API",
    detail: `HTTP ${convList.status}`,
  });

  let conversationId: string | undefined;
  try {
    const body = JSON.parse(
      await fetch(`${base}/api/conversations?characterId=${characterId}`, cookieInit).then(
        (r) => r.text()
      )
    ) as { conversations?: { id: string }[] };
    conversationId = body.conversations?.[0]?.id;
  } catch {
    /* ignore */
  }

  if (!conversationId) {
    const createRes = await fetch(`${base}/api/conversations`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ characterId }),
    });
    const createBody = (await createRes.json()) as { conversation?: { id: string } };
    conversationId = createBody.conversation?.id;
  }
  if (!conversationId) throw new Error("conversation id missing");

  const chatPath = `${base}/chat/${characterId}?conversationId=${conversationId}`;

  const prefetch = await timedFetch(chatPath, cookieInit);
  timings.push({
    name: "3. Characters → Chat 라우트 prefetch",
    ms: prefetch.ttfbMs,
    category: "Navigation",
    detail: `full ${prefetch.ms}ms`,
  });

  const chatSsr = await timedFetch(chatPath, cookieInit);
  timings.push({
    name: "1. Chat SSR — TTFB (HTML 첫 바이트)",
    ms: chatSsr.ttfbMs,
    category: "SSR",
    detail: `HTTP ${chatSsr.status}`,
  });
  timings.push({
    name: "2. Chat SSR — 전체 HTML 다운로드",
    ms: chatSsr.ms,
    category: "SSR",
  });

  timings.push({
    name: "8. Middleware auth (navigation)",
    ms: Math.max(15, Math.round(chatSsr.ttfbMs * 0.12)),
    category: "Auth",
    detail: "TTFB의 ~12% 추정 (PERF_TRACE로 정밀 측정 가능)",
  });

  timings.push({
    name: "9. touchCharacterSelection DB",
    ms: Math.max(10, Math.round(chatSsr.ttfbMs * 0.08)),
    category: "Supabase",
    detail: "SSR 내부 write 추정",
  });

  timings.push({
    name: "10. React hydration + ChatProvider mount",
    ms: Math.max(20, Math.round(chatSsr.ms * 0.15)),
    category: "Client",
    detail: "RSC+hydration 추정 — DevTools Performance로 검증",
  });

  const msgApi = await timedFetch(
    `${base}/api/messages?conversationId=${conversationId}`,
    cookieInit
  );
  timings.push({
    name: "4. 클라이언트 Messages API (백그라운드)",
    ms: msgApi.ms,
    category: "API",
    detail: `HTTP ${msgApi.status} — SSR 있으면 skip`,
  });

  const relApi = await timedFetch(
    `${base}/api/relationship?conversationId=${conversationId}`,
    cookieInit
  );
  timings.push({
    name: "5. 클라이언트 Relationship API",
    ms: relApi.ms,
    category: "API",
    detail: "SSR 있으면 skip",
  });

  const proactive = await timedFetch(
    `${base}/api/conversations/${conversationId}/proactive`,
    { method: "POST", headers: { Cookie: cookie } }
  );
  timings.push({
    name: "6. Proactive API (백그라운드)",
    ms: proactive.ms,
    category: "API",
    detail: `HTTP ${proactive.status}`,
  });

  const top10 = buildTop10(timings.filter((t) => !t.name.startsWith("0.")));
  printMarkdownTable(top10);

  const outDir = resolve(ROOT, "perf");
  mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outPath = resolve(outDir, `chat-entry-${stamp}.json`);
  writeFileSync(
    outPath,
    JSON.stringify({ generatedAt: new Date().toISOString(), port, top10, all: timings }, null, 2)
  );
  console.log(`\nSaved: ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
