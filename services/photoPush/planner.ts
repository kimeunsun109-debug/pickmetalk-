import {
  PHOTO_PUSH_ENGAGEMENT_HIGH,
  PHOTO_PUSH_ENGAGEMENT_LOW,
  PHOTO_PUSH_MAX_PER_DAY,
  PHOTO_PUSH_RANDOM_MINUTE_OFFSETS,
  PHOTO_PUSH_SKIP_DAYS_PER_MONTH_MAX,
  PHOTO_PUSH_SKIP_DAYS_PER_MONTH_MIN,
  PHOTO_PUSH_SPECIAL_BONUS_MAX,
} from "./constants";
import { getPhotoScenario, scenariosForWeekday } from "@/lib/photoPush/scenarios";
import {
  getPlanDayKey,
  getWeekday,
  wallClockToUtc,
} from "@/lib/photoPush/timezone";
import type { PhotoScenario } from "@/lib/photoPush/scenarios";
import type { SupabaseClient } from "@supabase/supabase-js";

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** 1–2 skip days per calendar month (stable per user+character). */
export function isScheduledSkipDay(
  userId: string,
  characterId: string,
  planDay: string
): boolean {
  const monthKey = planDay.slice(0, 7);
  const seed = hashSeed(`${userId}:${characterId}:${monthKey}`);
  const skipCount =
    PHOTO_PUSH_SKIP_DAYS_PER_MONTH_MIN +
    (seed % (PHOTO_PUSH_SKIP_DAYS_PER_MONTH_MAX - PHOTO_PUSH_SKIP_DAYS_PER_MONTH_MIN + 1));
  const dayNum = Number(planDay.slice(8, 10));
  const [year, month] = planDay.slice(0, 7).split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const skipDays = new Set<number>();
  for (let i = 0; i < skipCount; i += 1) {
    skipDays.add(1 + ((seed + i * 7) % daysInMonth));
  }
  return skipDays.has(dayNum);
}

export function plannedSendCount(
  engagementScore: number,
  isSkipDay: boolean,
  specialBonus: number
): number {
  if (isSkipDay) return Math.min(specialBonus, PHOTO_PUSH_SPECIAL_BONUS_MAX);
  let base = 1;
  if (engagementScore >= PHOTO_PUSH_ENGAGEMENT_HIGH) {
    base = Math.random() < 0.65 ? 2 : 1;
  } else if (engagementScore <= PHOTO_PUSH_ENGAGEMENT_LOW) {
    base = Math.random() < 0.4 ? 0 : 1;
  } else {
    base = Math.random() < 0.35 ? 2 : 1;
  }
  const total = Math.min(
    PHOTO_PUSH_MAX_PER_DAY,
    base + Math.min(specialBonus, PHOTO_PUSH_SPECIAL_BONUS_MAX)
  );
  return total;
}

function pickRandomMinute(): number {
  const idx = Math.floor(Math.random() * PHOTO_PUSH_RANDOM_MINUTE_OFFSETS.length);
  return PHOTO_PUSH_RANDOM_MINUTE_OFFSETS[idx] ?? 17;
}

function pickScenario(
  weekday: number,
  usedScenarioIds: Set<string>,
  preferSpecial: boolean
): PhotoScenario | null {
  let pool = scenariosForWeekday(weekday);
  if (preferSpecial) {
    const special = pool.filter((s) => s.category === "special");
    if (special.length) pool = special;
  }
  pool = pool.filter((s) => !usedScenarioIds.has(s.id));
  if (!pool.length) {
    pool = scenariosForWeekday(weekday);
  }
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}

function randomHourInWindow(scenario: PhotoScenario): number {
  const { startHour, endHour } = scenario.timeWindow;
  const span = Math.max(1, endHour - startHour);
  return startHour + Math.floor(Math.random() * span);
}

export async function ensureDailyPhotoPlan(
  supabase: SupabaseClient,
  params: {
    userId: string;
    characterId: string;
    conversationId: string;
    timezone: string;
    engagementScore: number;
    specialBonus: number;
    displayName: string | null;
  }
): Promise<{ planned: number; skipDay: boolean }> {
  const planDay = getPlanDayKey(new Date(), params.timezone);
  const weekday = getWeekday(new Date(), params.timezone);
  const skipDay = isScheduledSkipDay(
    params.userId,
    params.characterId,
    planDay
  );
  const count = plannedSendCount(
    params.engagementScore,
    skipDay,
    params.specialBonus
  );

  const { data: existing } = await supabase
    .from("photo_push_daily_plans")
    .select("id, planned_count")
    .eq("user_id", params.userId)
    .eq("character_id", params.characterId)
    .eq("plan_day", planDay)
    .maybeSingle();

  if (existing) {
    return { planned: existing.planned_count as number, skipDay };
  }

  const { data: planRow } = await supabase
    .from("photo_push_daily_plans")
    .insert({
      user_id: params.userId,
      character_id: params.characterId,
      plan_day: planDay,
      timezone: params.timezone,
      is_skip_day: skipDay,
      planned_count: count,
      special_bonus: params.specialBonus,
    })
    .select("id")
    .single();

  if (!planRow || count === 0) {
    return { planned: count, skipDay };
  }

  const usedScenarios = new Set<string>();
  const usedTimes = new Set<string>();

  for (let i = 0; i < count; i += 1) {
    const scenario = pickScenario(
      weekday,
      usedScenarios,
      params.specialBonus > 0 && i === 0
    );
    if (!scenario) continue;
    usedScenarios.add(scenario.id);

    let hour = randomHourInWindow(scenario);
    let minute = pickRandomMinute();
    let attempts = 0;
    while (attempts < 8) {
      const key = `${hour}:${minute}`;
      if (!usedTimes.has(key)) {
        usedTimes.add(key);
        break;
      }
      hour = randomHourInWindow(scenario);
      minute = pickRandomMinute();
      attempts += 1;
    }

    const scheduledAt = wallClockToUtc(
      planDay,
      hour,
      minute,
      params.timezone
    );

    await supabase.from("photo_push_scheduled").insert({
      user_id: params.userId,
      character_id: params.characterId,
      conversation_id: params.conversationId,
      plan_id: planRow.id,
      scheduled_at: scheduledAt,
      scenario_id: scenario.id,
      status: "pending",
      is_special_day: params.specialBonus > 0,
    });
  }

  return { planned: count, skipDay };
}

export function resolveSpecialBonus(
  isBirthday: boolean,
  isAnniversary100: boolean
): number {
  if (isBirthday || isAnniversary100) return PHOTO_PUSH_SPECIAL_BONUS_MAX;
  return 0;
}

export function scenarioById(id: string) {
  return getPhotoScenario(id);
}
