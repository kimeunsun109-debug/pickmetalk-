import { FREE_DAILY_MESSAGE_LIMIT } from "@/lib/constants";
import type { UserProfile } from "@/types";
import {
  canSendChatMessage,
  normalizeDailyUsage,
  remainingFreeMessages,
} from "./dailyMessageLimit";

export function canSendMessage(profile: UserProfile): boolean {
  if (profile.isPremium) return true;
  const { count } = normalizeDailyUsage(profile);
  return canSendChatMessage(profile, count);
}

export function freeMessagesRemaining(profile: UserProfile): number {
  const { count } = normalizeDailyUsage(profile);
  return remainingFreeMessages(profile, count);
}

export { FREE_DAILY_MESSAGE_LIMIT };
