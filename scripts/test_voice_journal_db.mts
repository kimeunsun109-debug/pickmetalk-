#!/usr/bin/env npx tsx
/** 저널 DB insert + export 스크립트 스모크 테스트 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { appendChatVoiceJournal } from "../lib/db/chatVoiceJournal";

const ROOT = resolve(import.meta.dirname, "..");

function loadEnv(): Record<string, string> {
  const env: Record<string, string> = { ...process.env } as Record<string, string>;
  const p = resolve(ROOT, ".env.local");
  if (!existsSync(p)) return env;
  for (const line of readFileSync(p, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#") || !t.includes("=")) continue;
    const eq = t.indexOf("=");
    env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

async function main() {
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !serviceKey || !anon) {
    console.error("Supabase URL + SERVICE_ROLE + ANON 필요");
    process.exit(1);
  }

  const admin = createClient(url, serviceKey);
  const anonClient = createClient(url, anon);
  const email = "demo.tester@pickmetalk.dev";
  const password = "DemoPass123!";

  const { data: auth, error: authErr } = await anonClient.auth.signInWithPassword({
    email,
    password,
  });
  if (authErr || !auth.user) {
    console.error("로그인 실패:", authErr?.message);
    process.exit(1);
  }
  const userId = auth.user.id;
  console.log("✅ 테스트 유저:", email);

  const { data: convs } = await admin
    .from("conversations")
    .select("id")
    .eq("user_id", userId)
    .eq("character_id", "yuna")
    .limit(1);

  const conversationId = convs?.[0]?.id;
  if (!conversationId) {
    console.log("⚠️ 유나 대화방 없음 — 저널 insert만 userId로 시도");
  }

  const userMsg = "오늘 29도 폭염이야ㅡㅡ";
  const reply = "[테스트] 에휴 나 완전 반대로 갔네 ㅋㅋ 에어컨 앞이 정답이지";

  await appendChatVoiceJournal(admin, {
    userId,
    conversationId: conversationId ?? "00000000-0000-0000-0000-000000000000",
    characterId: "yuna",
    userMessage: userMsg,
    assistantReply: reply,
    followUp: "joke",
  });

  const { data: rows, error } = await admin
    .from("chat_voice_journal")
    .select("id, assistant_reply, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("❌ 저널 테이블 없음/조회 실패:", error.message);
    console.error("   npx supabase db push (007_chat_voice_journal.sql)");
    process.exit(1);
  }

  console.log("✅ 저널 insert/조회 OK:", rows?.[0]?.assistant_reply?.slice(0, 50));
  process.exit(0);
}

main();
