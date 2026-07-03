#!/usr/bin/env npx tsx
/**
 * 말투 A/B 대화 1회 실행 — 텍스트 로그 저장
 *
 * 사용:
 *   npx tsx scripts/character_voice_ab_run.mts --character yuna --variant A --slot morning
 *   npx tsx scripts/character_voice_ab_run.mts --character yuna --variant A --slot lunch --user "오늘 야근각이야"
 *
 * 로그: experiments/voice-ab/logs/{YYYY-MM-DD}/{character}-{slot}-{variant}.md
 */
import { mkdirSync, writeFileSync, existsSync, readFileSync, appendFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import OpenAI from "openai";
import { buildSystemPrompt } from "../prompts/index";
import {
  type DaySlot,
  type VoiceAbVariant,
  VOICE_AB_LABELS,
  SLOT_USER_PROMPTS,
} from "../prompts/voiceAbVariants";

const ROOT = resolve(import.meta.dirname, "..");
const LOG_ROOT = resolve(ROOT, "experiments/voice-ab/logs");

function loadEnvLocal(): void {
  const path = resolve(ROOT, ".env.local");
  if (!existsSync(path)) return;
  const raw = readFileSync(path, "utf-8");
  for (const line of raw.split("\n")) {
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

function parseArgs(): {
  characterId: string;
  variant: VoiceAbVariant;
  slot: DaySlot;
  userMessage: string;
  date: string;
} {
  const args = process.argv.slice(2);
  let characterId = "yuna";
  let variant: VoiceAbVariant = "A";
  let slot: DaySlot = "morning";
  let userMessage = "";
  let date = new Date().toISOString().slice(0, 10);

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--character" && args[i + 1]) characterId = args[++i];
    else if (a === "--variant" && args[i + 1]) variant = args[++i] as VoiceAbVariant;
    else if (a === "--slot" && args[i + 1]) slot = args[++i] as DaySlot;
    else if (a === "--user" && args[i + 1]) userMessage = args[++i];
    else if (a === "--date" && args[i + 1]) date = args[++i];
  }

  if (!userMessage) {
    const pool = SLOT_USER_PROMPTS[slot];
    userMessage = pool[Math.floor(Math.random() * pool.length)]!;
  }

  return { characterId, variant, slot, userMessage, date };
}

function logPath(
  date: string,
  characterId: string,
  slot: DaySlot,
  variant: VoiceAbVariant
): string {
  return resolve(LOG_ROOT, date, `${characterId}-${slot}-${variant}.md`);
}

function appendJournal(
  date: string,
  characterId: string,
  variant: VoiceAbVariant,
  slot: DaySlot,
  userMessage: string,
  reply: string
): void {
  const journalDir = resolve(ROOT, "experiments/voice-ab");
  mkdirSync(journalDir, { recursive: true });
  const journalPath = resolve(journalDir, "journal.jsonl");
  const entry = {
    ts: new Date().toISOString(),
    date,
    characterId,
    variant,
    slot,
    variantLabel: VOICE_AB_LABELS[variant].label,
    userMessage,
    reply,
  };
  appendFileSync(journalPath, `${JSON.stringify(entry)}\n`, "utf-8");
}

async function main() {
  loadEnvLocal();
  const { characterId, variant, slot, userMessage, date } = parseArgs();

  if (!process.env.DEEPSEEK_API_KEY) {
    console.error("DEEPSEEK_API_KEY 필요 (.env.local)");
    process.exit(1);
  }

  const client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL:
      process.env.DEEPSEEK_BASE_URL?.replace(/\/$/, "") ??
      "https://api.deepseek.com",
  });

  const system = buildSystemPrompt(
    characterId,
    "happy",
    2,
    35,
    null,
    1,
    5,
    "",
    true,
    [
      { id: "1", role: "user", content: "요즘 좀 바빠", createdAt: "" },
      { id: "2", role: "assistant", content: "…많이 버텼겠다.", createdAt: "" },
    ],
    null,
    userMessage,
    null,
    { voiceAbVariant: variant }
  );

  const res = await client.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: system },
      { role: "user", content: "요즘 좀 바빠" },
      { role: "assistant", content: "…많이 버텼겠다." },
      { role: "user", content: userMessage },
    ],
    temperature: 0.9,
    max_tokens: 320,
  });

  const reply = res.choices[0]?.message?.content?.trim() ?? "";
  const outPath = logPath(date, characterId, slot, variant);
  mkdirSync(dirname(outPath), { recursive: true });

  const meta = VOICE_AB_LABELS[variant];
  const body = [
    `# ${characterId} · ${slot} · 변형 ${variant} (${meta.label})`,
    ``,
    `날짜: ${date}`,
    `슬롯: ${slot}`,
    `변형: ${variant} — ${meta.description}`,
    ``,
    `## 사용자`,
    userMessage,
    ``,
    `## 캐릭터`,
    reply,
    ``,
    `---`,
    `<!-- 오늘 마음에 든 말투? A/B/C 중 하나를 experiments/voice-ab/daily-notes/${date}.md 에 기록 -->`,
    ``,
  ].join("\n");

  writeFileSync(outPath, body, "utf-8");
  appendJournal(date, characterId, variant, slot, userMessage, reply);

  console.log(`저장: ${outPath}`);
  console.log(`\n사용자: ${userMessage}`);
  console.log(`응답: ${reply}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
