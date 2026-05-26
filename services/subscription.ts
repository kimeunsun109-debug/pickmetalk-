import { FREE_DAILY_MESSAGE_LIMIT, TRIAL_DAYS } from "@/lib/constants";
import type { UserProfile } from "@/types";

export function canSendMessage(profile: UserProfile): boolean {
  if (profile.isPremium) return true;
  const trialOk =
    profile.trialEndsAt &&
    new Date(profile.trialEndsAt) > new Date();
  if (!trialOk && !profile.isPremium) {
    /* 체험 만료 후에도 무료 한도 로직 확장 가능 */
  }
  return profile.dailyMessageCount < FREE_DAILY_MESSAGE_LIMIT;
}

export function trialDaysRemaining(trialEndsAt: string | null): number {
  if (!trialEndsAt) return TRIAL_DAYS;
  const diff = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
