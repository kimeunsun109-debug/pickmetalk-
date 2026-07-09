#!/usr/bin/env npx tsx
/**
 * 앱 채팅 API E2E — 로그인 → 대화 → (저널 테이블 확인)
 * Usage: npx tsx scripts/test_chat_e2e.mts [--port 3001]
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const ROOT = resolve(import.meta.dirname, "..");

function loadEnv(): Record<string, string> {
  const env: Record<string, string> = { ...process.env } as Record<string, string>;
  const path = resolve(ROOT, ".env.local");
  if (!existsSync(path)) return env;
  for (const line of readFileSync(path, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#") || !t.includes("=")) continue;
    const eq = t.indexOf("=");
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1);
    env[k] = v;
  }
  return env;
}

async function main() {
  const env = loadEnv();
  const port = process.argv.includes("--port")
    ? process.argv[process.argv.indexOf("--port") + 1]
    : "3001";
  const base = `http://localhost:${port}`;

  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const email = env.TEST_USER_EMAIL ?? "demo.tester@pickmetalk.dev";
  const password = env.TEST_USER_PASSWORD ?? "DemoPass123!";

  if (!url || !anon) {
    console.error("Supabase env 없음");
    process.exit(1);
  }

  const supabase = createClient(url, anon);
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authErr || !auth.session) {
    console.error("로그인 실패:", authErr?.message ?? "no session");
    console.error("TEST_USER_EMAIL / TEST_USER_PASSWORD in .env.local 확인");
    process.exit(1);
  }

  const token = auth.session.access_token;
  console.log(`✅ 로그인: ${email}`);

  const charsRes = await fetch(`${base}/api/characters`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!charsRes.ok) {
    console.log("characters API:", charsRes.status, await charsRes.text());
  }

  const convRes = await fetch(`${base}/api/conversations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ characterId: "yuna" }),
  });

  let convBody: { conversationId?: string; id?: string; error?: string } = {};
  try {
    convBody = await convRes.json();
  } catch {
    /* */
  }

  if (!convRes.ok) {
    console.error("대화방 생성 실패:", convRes.status, convBody);
    process.exit(1);
  }

  const conversationId = convBody.conversationId ?? convBody.id;
  if (!conversationId) {
    console.error("conversationId 없음", convBody);
    process.exit(1);
  }
  console.log(`✅ 대화방: ${conversationId}`);

  const userMsg = "오늘 29도 폭염이야ㅡㅡ";
  const chatRes = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ conversationId, message: userMsg }),
  });

  if (!chatRes.ok) {
    console.error("채팅 실패:", chatRes.status, await chatRes.text());
    process.exit(1);
  }

  const reader = chatRes.body?.getReader();
  if (!reader) {
    console.error("스트림 없음");
    process.exit(1);
  }

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
      const json = line.slice(5).trim();
      if (!json) continue;
      const chunk = JSON.parse(json) as {
        content?: string;
        replace?: boolean;
        done?: boolean;
        error?: string;
      };
      if (chunk.error) throw new Error(chunk.error);
      if (chunk.content) {
        full = chunk.replace ? chunk.content : full + chunk.content;
      }
      if (chunk.done) done = true;
    }
  }

  console.log(`\n사용자: ${userMsg}`);
  console.log(`유나: ${full}`);

  const WIT = /ㅋ|속았|머리\s?비|에휴|헐|대박|착각|반대/i;
  const FLAT = /^아\.?\.?\s*맞다!?\s*착각했네\.?$/;
  console.log(
    WIT.test(full) && !FLAT.test(full.trim())
      ? "\n✅ 센스 응답 OK"
      : "\n⚠️ 센스 약함 — 프롬프트 추가 튜닝 필요"
  );

  await new Promise((r) => setTimeout(r, 2000));

  if (serviceKey) {
    const admin = createClient(url, serviceKey);
    const { data: rows, error: jErr } = await admin
      .from("chat_voice_journal")
      .select("id, user_message, assistant_reply, created_at")
      .eq("user_id", auth.user!.id)
      .order("created_at", { ascending: false })
      .limit(3);

    if (jErr) {
      console.log("\n⚠️ 저널 테이블:", jErr.message);
      console.log("   → npx supabase db push 로 007 마이그레이션 적용");
    } else if (!rows?.length) {
      console.log("\n⚠️ 저널 행 없음 (insert 스킵됐을 수 있음)");
    } else {
      console.log(`\n✅ voice 저널 최근 ${rows.length}건:`);
      for (const row of rows) {
        console.log(`  - ${row.created_at}: ${String(row.assistant_reply).slice(0, 60)}…`);
      }
    }
  } else {
    console.log("\n(SUPABASE_SERVICE_ROLE_KEY 없어 저널 DB 확인 스킵)");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
