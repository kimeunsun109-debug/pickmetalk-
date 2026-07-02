import {
  getPatternAlertPlans,
  upsertPatternAlertPlan,
} from "@/lib/db/dailyPatterns";
import type { DailyPatternType, UserDailyPattern } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_OFFSETS: Record<DailyPatternType, number> = {
  wake: -5,
  work_start: -15,
  lunch: -10,
  work_end: -10,
  exercise: -20,
  sleep: -15,
};

const MIN_CONFIDENCE_FOR_PLAN = 55;

function minuteToDateInKst(minuteOfDay: number, nowIso: string): Date {
  const now = new Date(nowIso);
  const utc = new Date(now.getTime());
  const kstDay = new Date(utc.getTime() + 9 * 60 * 60 * 1000);
  const midnightKstUtcMs = Date.UTC(
    kstDay.getUTCFullYear(),
    kstDay.getUTCMonth(),
    kstDay.getUTCDate(),
    0,
    -9,
    0,
    0
  );
  return new Date(midnightKstUtcMs + minuteOfDay * 60_000);
}

export function computeNextTriggerAt(
  pattern: UserDailyPattern,
  offsetMinutes: number,
  nowIso: string
): string {
  const anchor = minuteToDateInKst(pattern.timeStartMinute, nowIso);
  const target = new Date(anchor.getTime() + offsetMinutes * 60_000);
  const now = new Date(nowIso);
  if (target.getTime() <= now.getTime()) {
    target.setUTCDate(target.getUTCDate() + 1);
  }
  return target.toISOString();
}

export async function refreshPatternAlertPlans(
  supabase: SupabaseClient,
  userId: string,
  patterns: UserDailyPattern[],
  nowIso: string
) {
  const existingPlans = await getPatternAlertPlans(supabase, userId);
  const plansByType = new Map(existingPlans.map((p) => [p.patternType, p]));

  for (const pattern of patterns) {
    const existing = plansByType.get(pattern.patternType);
    const enabled = pattern.confidence >= MIN_CONFIDENCE_FOR_PLAN;
    const offsetMinutes = existing?.offsetMinutes ?? DEFAULT_OFFSETS[pattern.patternType];
    const nextTriggerAt = enabled
      ? computeNextTriggerAt(pattern, offsetMinutes, nowIso)
      : null;

    await upsertPatternAlertPlan(supabase, {
      userId,
      patternType: pattern.patternType,
      offsetMinutes,
      enabled,
      nextTriggerAt,
      computedAt: nowIso,
    });
  }
}
