#!/usr/bin/env npx tsx
/**
 * Cross-device sync smoke test (PC API path → Supabase messages).
 *
 * Usage:
 *   npx tsx scripts/verify_cross_device_sync.mts [baseUrl]
 *
 * Requires .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   TEST_USER_EMAIL, TEST_USER_PASSWORD (optional — defaults to demo tester)
 */
import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

function loadEnv(): Record<string, string> {
  const env: Record<string, string> = { ...process.env } as Record<
    string,
    string
  >;
  for (const path of [".env.local", ".env"]) {
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf-8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#") || !t.includes("=")) continue;
      const eq = t.indexOf("=");
      env[t.slice(0, eq).trim()] = t
        .slice(eq + 1)
        .trim()
        .replace(/^["']|["']$/g, "");
    }
  }
  return env;
}

async function main() {
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / ANON_KEY required in .env.local");
  }

  const email = env.TEST_USER_EMAIL ?? "demo.tester@pickmetalk.dev";
  const password = env.TEST_USER_PASSWORD ?? "DemoPass123!";
  const base = process.argv[2] ?? env.NEXT_PUBLIC_APP_URL ?? "https://pickmetalk.com";

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

  const browser = createClient(url, anon);
  const { data, error } = await browser.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.session) {
    throw new Error(error?.message ?? "login failed");
  }

  await server.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });

  const cookie = jar.map((c) => `${c.name}=${c.value}`).join("; ");
  const headers = { Cookie: cookie };

  const unauth = await fetch(`${base}/api/messages?conversationId=test`, {
    redirect: "follow",
  });
  const unauthOk = unauth.status === 401;

  const convRes = await fetch(`${base}/api/conversations`, {
    headers,
    cache: "no-store",
  });
  const convData = (await convRes.json()) as {
    conversations?: Array<{
      id: string;
      characterId: string;
      lastMessagePreview?: string | null;
    }>;
    error?: string;
  };

  let messagesOk = false;
  let messageCount = 0;
  const firstConv = convData.conversations?.[0];

  if (firstConv?.id) {
    const msgRes = await fetch(
      `${base}/api/messages?conversationId=${firstConv.id}`,
      { headers, cache: "no-store" }
    );
    const msgData = (await msgRes.json()) as { messages?: unknown[] };
    messagesOk = msgRes.ok && Array.isArray(msgData.messages);
    messageCount = msgData.messages?.length ?? 0;
  }

  const manifestRes = await fetch(`${base}/manifest.json`);
  const manifestOk = manifestRes.ok;
  const manifest = manifestOk
    ? ((await manifestRes.json()) as { display?: string })
    : null;

  const report = {
    base,
    userId: data.user.id,
    checks: {
      unauthMessagesBlocked: unauthOk,
      conversationsApi: convRes.ok,
      conversationCount: convData.conversations?.length ?? 0,
      hasLastMessagePreviewField:
        firstConv == null || "lastMessagePreview" in firstConv,
      messagesApi: firstConv ? messagesOk : null,
      messageCount,
      manifestStandalone: manifest?.display === "standalone",
    },
    manualMobileSteps: [
      "1. PC·폰 모두 pickmetalk.com + 동일 이메일 로그인",
      "2. PC에서 캐릭터 채팅 2~3턴",
      "3. 폰 /conversations → 같은 대화방 → 히스토리 확인",
      "4. (선택) iOS Safari 홈 화면 추가 / Android PWA 설치",
    ],
    pass:
      unauthOk &&
      convRes.ok &&
      manifestOk &&
      (firstConv == null || messagesOk),
  };

  console.log(JSON.stringify(report, null, 2));
  if (!report.pass) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
