import { FREE_DAILY_MESSAGE_LIMIT } from "@/lib/constants";
import type { UserProfile } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";

const USAGE_TIMEZONE = "Asia/Seoul";

/** Calendar day key for daily_message_count reset (KST). */
export function getUsageDayKey(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: USAGE_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function normalizeDailyUsage(profile: UserProfile): {
  count: number;
  needsReset: boolean;
  usageDay: string;
} {
  const usageDay = getUsageDayKey();
  const resetDay = getUsageDayKey(new Date(profile.dailyMessageResetAt));
  if (resetDay !== usageDay) {
    return { count: 0, needsReset: true, usageDay };
  }
  return {
    count: profile.dailyMessageCount,
    needsReset: false,
    usageDay,
  };
}

export function canSendChatMessage(
  profile: UserProfile,
  countAfterReset: number
): boolean {
  if (profile.isPremium) return true;
  return countAfterReset < FREE_DAILY_MESSAGE_LIMIT;
}

export function remainingFreeMessages(
  profile: UserProfile,
  countAfterReset: number
): number {
  if (profile.isPremium) return Infinity;
  return Math.max(0, FREE_DAILY_MESSAGE_LIMIT - countAfterReset);
}

/** Reset count when KST date rolled over; returns effective count for this request. */
export async function ensureDailyUsageFresh(
  supabase: SupabaseClient,
  userId: string,
  profile: UserProfile
): Promise<{ count: number; isPremium: boolean }> {
  const { count, needsReset } = normalizeDailyUsage(profile);

  if (needsReset) {
    const now = new Date().toISOString();
    await supabase
      .from("profiles")
      .update({
        daily_message_count: 0,
        daily_message_reset_at: now,
      })
      .eq("id", userId);
    return { count: 0, isPremium: profile.isPremium };
  }

  return { count, isPremium: profile.isPremium };
}

/** After a user message is persisted (not resend). */
export async function incrementDailyMessageCount(
  supabase: SupabaseClient,
  userId: string,
  currentCount: number
): Promise<void> {
  const now = new Date().toISOString();
  await supabase
    .from("profiles")
    .update({
      daily_message_count: currentCount + 1,
      daily_message_reset_at: now,
    })
    .eq("id", userId);
}
