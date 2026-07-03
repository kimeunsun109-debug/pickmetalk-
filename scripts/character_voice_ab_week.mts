#!/usr/bin/env npx tsx
/**
 * 7일 × 3~4슬롯 말투 A/B 주간 시뮬레이션 (API 호출)
 *
 * 사용:
 *   npx tsx scripts/character_voice_ab_week.mts --character yuna
 *   npx tsx scripts/character_voice_ab_week.mts --character yuna --days 3 --no-dawn
 *
 * 일정: VOICE_AB_WEEK_SCHEDULE — 1일 A, 2일 B, 3일 C …
 * 로그: experiments/voice-ab/logs/
 */
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import {
  DAY_SLOTS,
  VOICE_AB_WEEK_SCHEDULE,
  type DaySlot,
  type VoiceAbVariant,
} from "../prompts/voiceAbVariants";

const ROOT = resolve(import.meta.dirname, "..");
const RUN_SCRIPT = resolve(ROOT, "scripts/character_voice_ab_run.mts");

function parseArgs(): {
  characterId: string;
  days: number;
  includeDawn: boolean;
  startDate: string;
} {
  const args = process.argv.slice(2);
  let characterId = "yuna";
  let days = 7;
  let includeDawn = true;
  let startDate = new Date().toISOString().slice(0, 10);

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--character" && args[i + 1]) characterId = args[++i];
    else if (a === "--days" && args[i + 1]) days = Number(args[++i]);
    else if (a === "--start" && args[i + 1]) startDate = args[++i];
    else if (a === "--no-dawn") includeDawn = false;
  }

  return { characterId, days, includeDawn, startDate };
}

function addDays(isoDate: string, offset: number): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

function runSlot(
  characterId: string,
  variant: VoiceAbVariant,
  slot: DaySlot,
  date: string
): void {
  const r = spawnSync(
    "npx",
    [
      "tsx",
      RUN_SCRIPT,
      "--character",
      characterId,
      "--variant",
      variant,
      "--slot",
      slot,
      "--date",
      date,
    ],
    { cwd: ROOT, stdio: "inherit", env: process.env }
  );
  if (r.status !== 0) {
    throw new Error(`실패: ${date} ${slot} ${variant}`);
  }
}

async function main() {
  const { characterId, days, includeDawn, startDate } = parseArgs();
  const slots: DaySlot[] = includeDawn
    ? DAY_SLOTS
    : DAY_SLOTS.filter((s) => s !== "dawn");

  console.log(`캐릭터: ${characterId}, ${days}일, 슬롯: ${slots.join(", ")}`);

  for (let day = 0; day < days; day++) {
    const date = addDays(startDate, day);
    const variant = VOICE_AB_WEEK_SCHEDULE[day % VOICE_AB_WEEK_SCHEDULE.length]!;
    console.log(`\n=== ${date} · 변형 ${variant} ===`);
    for (const slot of slots) {
      runSlot(characterId, variant, slot, date);
    }
  }

  console.log("\n완료. 분석: npx tsx scripts/analyze_voice_ab_logs.mts");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
