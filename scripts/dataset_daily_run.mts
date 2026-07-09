#!/usr/bin/env npx tsx
/**
 * 일일 대화 수집 — 아침/점심/저녁 × 10턴 = 30턴+
 * 분석·태그·점수 → dataset/
 *
 * npx tsx scripts/dataset_daily_run.mts
 * npx tsx scripts/dataset_daily_run.mts --date 2026-07-03 --turns 10
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import OpenAI from "openai";
import { buildSystemPrompt } from "../prompts/index";
import {
  characterForSlot,
  pickScenariosForDay,
  type DatasetScenario,
} from "../lib/dataset/scenarios";
import { analyzeTurnSentences } from "../lib/dataset/analyzer";
import { TURNS_PER_SLOT, MIN_DAILY_TURNS } from "../lib/dataset/constants";
import {
  initDatasetDirs,
  saveDailyLog,
  appendBestLines,
  updateStatistics,
  updateConversationPatterns,
  updateUserStylePatterns,
} from "../lib/dataset/storage";
import type { ConversationTurn, DailyLog, DailySession, DaySlot } from "../lib/dataset/types";

const ROOT = resolve(import.meta.dirname, "..");

function loadEnv(): void {
  const p = resolve(ROOT, ".env.local");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#") || !t.includes("=")) continue;
    const eq = t.indexOf("=");
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1);
    if (!process.env[k]) process.env[k] = v;
  }
}

function parseArgs(): { date: string; turnsPerSlot: number } {
  const args = process.argv.slice(2);
  let date = new Date().toISOString().slice(0, 10);
  let turnsPerSlot = TURNS_PER_SLOT;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--date" && args[i + 1]) date = args[++i];
    if (args[i] === "--turns" && args[i + 1]) turnsPerSlot = Number(args[++i]);
  }
  return { date, turnsPerSlot };
}

async function chat(
  client: OpenAI,
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>
): Promise<string> {
  const res = await client.chat.completions.create({
    model: "deepseek-chat",
    messages,
    temperature: 0.92,
    max_tokens: 320,
  });
  return res.choices[0]?.message?.content?.trim() ?? "";
}

async function simulateUser(
  client: OpenAI,
  scenario: DatasetScenario,
  history: Array<{ user: string; assistant: string }>,
  turnIndex: number
): Promise<string> {
  if (turnIndex === 0) return scenario.opener;

  const beat = scenario.beats[turnIndex % scenario.beats.length];
  const transcript = history
    .slice(-4)
    .map((h) => `나: ${h.user}\n연인: ${h.assistant}`)
    .join("\n");

  return chat(client, [
    {
      role: "system",
      content: `35~45세 직장인 남성이 AI 여자친구와 카톡한다.
시나리오: ${scenario.title}
성격: ${scenario.userPersona}
자연스러운 연인 톤. 1~2문장. 짧게. 이번 힌트: ${beat}
리액션(ㅋㅋ, 헐, 와.)도 자연스럽게 섞어도 됨.`,
    },
    {
      role: "user",
      content: `지금까지:\n${transcript}\n\n다음 내 메시지 한 줄만:`,
    },
  ]);
}

async function runSession(
  client: OpenAI,
  date: string,
  slot: DaySlot,
  scenario: DatasetScenario,
  characterId: string,
  turnsPerSlot: number
): Promise<DailySession> {
  const sessionId = randomUUID();
  const turns: ConversationTurn[] = [];
  const sentences: DailySession["sentences"] = [];
  const history: Array<{ user: string; assistant: string }> = [];

  const apiMessages: Array<{ role: "user" | "assistant"; content: string }> = [];

  console.log(`\n--- ${slot} · ${scenario.title} · ${characterId} (${turnsPerSlot}턴) ---`);

  for (let t = 1; t <= turnsPerSlot; t++) {
    const userMsg = await simulateUser(client, scenario, history, t - 1);
    const system = buildSystemPrompt(
      characterId,
      "happy",
      3,
      45,
      null,
      1,
      t + 2,
      "",
      t > 1,
      apiMessages.map((m, i) => ({
        id: String(i),
        role: m.role,
        content: m.content,
        createdAt: "",
      })),
      null,
      userMsg,
      null
    );

    const charMsgs = [
      { role: "system" as const, content: system },
      ...apiMessages.flatMap((m) => [
        { role: m.role as "user" | "assistant", content: m.content },
      ]),
      { role: "user" as const, content: userMsg },
    ];

    const assistantMsg = await chat(client, charMsgs);
    apiMessages.push({ role: "user", content: userMsg });
    apiMessages.push({ role: "assistant", content: assistantMsg });
    history.push({ user: userMsg, assistant: assistantMsg });

    const turn: ConversationTurn = {
      turn: t,
      user: userMsg,
      assistant: assistantMsg,
      characterId,
    };
    turns.push(turn);

    const analyzed = await analyzeTurnSentences({
      client,
      date,
      slot,
      sessionId,
      turn,
      scenarioTitle: scenario.title,
    });
    sentences.push(...analyzed);

    const stars = analyzed.filter((s) => s.role === "assistant" && s.score >= 4);
    console.log(
      `  [${t}] 나: ${userMsg.slice(0, 40)}${userMsg.length > 40 ? "…" : ""}`
    );
    console.log(
      `      ${characterId}: ${assistantMsg.slice(0, 50)}${assistantMsg.length > 50 ? "…" : ""}`
    );
    if (stars.length)
      console.log(`      ★ ${stars.map((s) => s.scoreLabel).join(" ")}`);
  }

  return {
    id: sessionId,
    slot,
    scenarioId: scenario.id,
    scenarioTitle: scenario.title,
    characterId,
    startedAt: new Date().toISOString(),
    turns,
    sentences,
  };
}

async function main() {
  loadEnv();
  const { date, turnsPerSlot } = parseArgs();

  if (!process.env.DEEPSEEK_API_KEY) {
    console.error("DEEPSEEK_API_KEY 필요");
    process.exit(1);
  }

  initDatasetDirs();

  const client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL:
      process.env.DEEPSEEK_BASE_URL?.replace(/\/$/, "") ??
      "https://api.deepseek.com",
  });

  const scenarios = pickScenariosForDay(date);
  const slots: DaySlot[] = ["morning", "lunch", "evening"];
  const sessions: DailySession[] = [];

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i]!;
    const scenario = scenarios[i]!;
    const characterId = characterForSlot(slot, date);
    sessions.push(
      await runSession(client, date, slot, scenario, characterId, turnsPerSlot)
    );
  }

  const totalTurns = sessions.reduce((s, x) => s + x.turns.length, 0);
  const allSentences = sessions.flatMap((s) => s.sentences);
  const fiveStar = allSentences.filter((s) => s.score === 5).length;

  const log: DailyLog = {
    date,
    sessions,
    meta: {
      totalTurns,
      totalSentences: allSentences.length,
      fiveStarCount: fiveStar,
    },
  };

  saveDailyLog(log);
  appendBestLines(allSentences);
  updateStatistics(log);
  updateConversationPatterns(log);
  updateUserStylePatterns(log);

  console.log(`\n✅ ${date} 저장 완료`);
  console.log(`   턴: ${totalTurns} (목표 ${MIN_DAILY_TURNS}+)`);
  console.log(`   분석 문장: ${allSentences.length}`);
  console.log(`   ★★★★★: ${fiveStar} → dataset/best_lines.json`);
  console.log(`   → dataset/daily_logs/${date}.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
