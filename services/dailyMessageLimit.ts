import { FREE_DAILY_MESSAGE_LIMIT } from "@/lib/constants";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import type { UserProfile } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";

const USAGE_TIMEZONE = "Asia/Seoul";
const MAX_CAS_ATTEMPTS = 5;

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

async function readQuotaProfile(userId: string) {
  const admin = createServiceRoleClient();
  const { data } = await admin
    .from("profiles")
    .select("daily_message_count, daily_message_reset_at, is_premium")
    .eq("id", userId)
    .maybeSingle();
  return data;
}

export async function ensureDailyUsageFresh(
  _supabase: SupabaseClient,
  userId: string,
  profile: UserProfile
): Promise<{ count: number; isPremium: boolean }> {
  const { count, needsReset } = normalizeDailyUsage(profile);

  if (!needsReset) {
    return { count, isPremium: profile.isPremium };
  }

  const admin = createServiceRoleClient();
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("profiles")
    .update({
      daily_message_count: 0,
      daily_message_reset_at: now,
    })
    .eq("id", userId)
    .select("daily_message_count, is_premium")
    .single();

  if (!error && data) {
    return {
      count: (data.daily_message_count as number) ?? 0,
      isPremium: (data.is_premium as boolean) ?? profile.isPremium,
    };
  }

  const row = await readQuotaProfile(userId);
  if (!row) {
    return { count: profile.dailyMessageCount, isPremium: profile.isPremium };
  }

  return {
    count: (row.daily_message_count as number) ?? profile.dailyMessageCount,
    isPremium: (row.is_premium as boolean) ?? profile.isPremium,
  };
}

/** Reserve one slot before persisting user message (resend skips this). */
export async function tryReserveDailyMessageSlot(
  _supabase: SupabaseClient,
  userId: string,
  expectedCount: number,
  attempt = 0
): Promise<boolean> {
  if (expectedCount >= FREE_DAILY_MESSAGE_LIMIT) {
    return false;
  }
  if (attempt >= MAX_CAS_ATTEMPTS) {
    return false;
  }

  const admin = createServiceRoleClient();
  const now = new Date().toISOString();
  const { data } = await admin
    .from("profiles")
    .update({
      daily_message_count: expectedCount + 1,
      daily_message_reset_at: now,
    })
    .eq("id", userId)
    .eq("daily_message_count", expectedCount)
    .select("id")
    .maybeSingle();

  if (data) return true;

  const row = await readQuotaProfile(userId);
  const latest = (row?.daily_message_count as number) ?? expectedCount;
  if (latest >= FREE_DAILY_MESSAGE_LIMIT) return false;

  const nextExpected = latest !== expectedCount ? latest : expectedCount;
  return tryReserveDailyMessageSlot(_supabase, userId, nextExpected, attempt + 1);
}
