#!/usr/bin/env npx tsx
/** Cookie-auth hello-world for Cloud env verification */
import { readFileSync, existsSync } from "node:fs";
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

async function main() {
  const env = loadEnv();
  const port = process.argv.includes("--port")
    ? process.argv[process.argv.indexOf("--port") + 1]
    : "3001";
  const base = `http://localhost:${port}`;
  const url = env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const email = env.TEST_USER_EMAIL ?? "demo.tester@pickmetalk.dev";
  const password = env.TEST_USER_PASSWORD ?? "DemoPass123!";

  const browser = createClient(url, anon);
  const { data: auth, error } = await browser.auth.signInWithPassword({ email, password });
  if (error || !auth.session) {
    console.error("로그인 실패:", error?.message);
    process.exit(1);
  }
  console.log(`✅ 로그인: ${email}`);

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
  const cookieHeader = jar.map((c) => `${c.name}=${c.value}`).join("; ");

  const convRes = await fetch(`${base}/api/conversations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieHeader },
    body: JSON.stringify({ characterId: "yuna" }),
  });
  const convBody = (await convRes.json()) as {
    conversation?: { id: string };
    conversationId?: string;
    id?: string;
    error?: string;
  };
  if (!convRes.ok) {
    console.error("대화방 생성 실패:", convRes.status, convBody);
    process.exit(1);
  }
  const conversationId =
    convBody.conversation?.id ?? convBody.conversationId ?? convBody.id;
  console.log(`✅ 대화방: ${conversationId}`);

  const userMsg = "안녕! 오늘 날씨 어때?";
  const chatRes = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieHeader },
    body: JSON.stringify({ conversationId, message: userMsg }),
  });
  if (!chatRes.ok) {
    console.error("채팅 실패:", chatRes.status, await chatRes.text());
    process.exit(1);
  }

  const reader = chatRes.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";
  let done = false;
  while (!done) {
    const { value, done: rd } = await reader.read();
    if (rd) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith("data:")) continue;
      const chunk = JSON.parse(line.slice(5).trim()) as {
        content?: string;
        replace?: boolean;
        done?: boolean;
        error?: string;
      };
      if (chunk.error) throw new Error(chunk.error);
      if (chunk.content) full = chunk.replace ? chunk.content : full + chunk.content;
      if (chunk.done) done = true;
    }
  }

  console.log(`\n사용자: ${userMsg}`);
  console.log(`유나: ${full}`);
  console.log(full.length > 10 ? "\n✅ Hello-world 채팅 OK" : "\n❌ 빈 응답");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
