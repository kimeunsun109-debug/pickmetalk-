import { mapPatternAlertPlan, mapUserDailyPattern } from "@/lib/db/mappers";
import type {
  DailyPatternType,
  PatternAlertPlan,
  UserDailyPattern,
} from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";

interface UpsertDailyPatternInput {
  userId: string;
  patternType: DailyPatternType;
  timeStartMinute: number;
  timeEndMinute: number;
  confidence: number;
  evidenceCount: number;
  timezone: string;
  observedAt: string;
  messageId: string | null;
}

function clampMinute(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1439, Math.round(value)));
}

function clampConfidence(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export async function getDailyPatternsForUser(
  supabase: SupabaseClient,
  userId: string,
  minConfidence = 0
): Promise<UserDailyPattern[]> {
  const { data, error } = await supabase
    .from("user_daily_patterns")
    .select("*")
    .eq("user_id", userId)
    .gte("confidence", minConfidence)
    .order("confidence", { ascending: false })
    .order("evidence_count", { ascending: false });

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapUserDailyPattern);
}

export async function getDailyPatternByType(
  supabase: SupabaseClient,
  userId: string,
  patternType: DailyPatternType
): Promise<UserDailyPattern | null> {
  const { data, error } = await supabase
    .from("user_daily_patterns")
    .select("*")
    .eq("user_id", userId)
    .eq("pattern_type", patternType)
    .maybeSingle();
  if (error || !data) return null;
  return mapUserDailyPattern(data as Record<string, unknown>);
}

export async function upsertDailyPattern(
  supabase: SupabaseClient,
  input: UpsertDailyPatternInput
): Promise<void> {
  await supabase.from("user_daily_patterns").upsert(
    {
      user_id: input.userId,
      pattern_type: input.patternType,
      time_start_minute: clampMinute(input.timeStartMinute),
      time_end_minute: clampMinute(input.timeEndMinute),
      confidence: clampConfidence(input.confidence),
      evidence_count: Math.max(1, Math.round(input.evidenceCount)),
      timezone: input.timezone || "Asia/Seoul",
      last_observed_at: input.observedAt,
      last_updated_at: input.observedAt,
      updated_from_message_id: input.messageId,
    },
    { onConflict: "user_id,pattern_type" }
  );
}

export async function getPatternAlertPlans(
  supabase: SupabaseClient,
  userId: string
): Promise<PatternAlertPlan[]> {
  const { data, error } = await supabase
    .from("user_pattern_alert_plans")
    .select("*")
    .eq("user_id", userId)
    .order("pattern_type", { ascending: true });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapPatternAlertPlan);
}

export async function upsertPatternAlertPlan(
  supabase: SupabaseClient,
  input: {
    userId: string;
    patternType: DailyPatternType;
    offsetMinutes: number;
    enabled: boolean;
    nextTriggerAt: string | null;
    computedAt: string;
  }
) {
  await supabase.from("user_pattern_alert_plans").upsert(
    {
      user_id: input.userId,
      pattern_type: input.patternType,
      offset_minutes: Math.round(input.offsetMinutes),
      enabled: input.enabled,
      next_trigger_at: input.nextTriggerAt,
      last_computed_at: input.computedAt,
      updated_at: input.computedAt,
    },
    { onConflict: "user_id,pattern_type" }
  );
}
