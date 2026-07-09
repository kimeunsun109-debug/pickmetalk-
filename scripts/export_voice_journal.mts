#!/usr/bin/env npx tsx
/**
 * Supabase chat_voice_journal → experiments/voice-ab/journal-app.jsonl 동기화
 *
 * 사용 (로그인 세션 쿠키 또는 SERVICE_ROLE):
 *   npx tsx scripts/export_voice_journal.mts
 *   npx tsx scripts/export_voice_journal.mts --since 2026-07-01
 *
 * .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (또는 로컬 dev + 쿠키)
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { toJournalJsonlLine, type VoiceJournalRow } from "../lib/db/chatVoiceJournal";

const ROOT = resolve(import.meta.dirname, "..");
const OUT = resolve(ROOT, "experiments/voice-ab/journal-app.jsonl");
const MERGED = resolve(ROOT, "experiments/voice-ab/journal.jsonl");

function loadEnvLocal(): void {
  const path = resolve(ROOT, ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const eq = trimmed.indexOf("=");
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

function parseArgs(): { since?: string; userId?: string; limit: number } {
  const args = process.argv.slice(2);
  let since: string | undefined;
  let userId: string | undefined;
  let limit = 2000;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--since" && args[i + 1]) since = args[++i];
    else if (args[i] === "--user" && args[i + 1]) userId = args[++i];
    else if (args[i] === "--limit" && args[i + 1]) limit = Number(args[++i]);
  }
  return { since, userId, limit };
}

async function main() {
  loadEnvLocal();
  const { since, userId, limit } = parseArgs();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error("NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY 필요");
    process.exit(1);
  }

  const supabase = createClient(url, key);

  let query = supabase
    .from("chat_voice_journal")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (since) query = query.gte("created_at", `${since}T00:00:00.000Z`);
  if (userId) query = query.eq("user_id", userId);

  const { data, error } = await query;

  if (error) {
    console.error("조회 실패:", error.message);
    console.error("→ npx supabase db push 또는 migration 007 적용");
    process.exit(1);
  }

  const rows = (data ?? []) as VoiceJournalRow[];
  mkdirSync(resolve(ROOT, "experiments/voice-ab"), { recursive: true });

  const lines = rows.map((r) => toJournalJsonlLine(r)).join("\n");
  writeFileSync(OUT, lines + (lines ? "\n" : ""), "utf-8");
  console.log(`앱 저널 ${rows.length}건 → ${OUT}`);

  if (existsSync(MERGED)) {
    const existing = readFileSync(MERGED, "utf-8").trim();
    const combined = existing ? `${existing}\n${lines}` : lines;
    writeFileSync(MERGED, combined + (combined ? "\n" : ""), "utf-8");
    console.log(`병합 → ${MERGED}`);
  } else if (lines) {
    appendFileSync(MERGED, lines + "\n", "utf-8");
    console.log(`생성 → ${MERGED}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
