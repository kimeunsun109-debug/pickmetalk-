import { FREE_DAILY_MESSAGE_LIMIT } from "@/lib/constants";
import type { UserProfile } from "@/types";
import {
  canSendChatMessage,
  normalizeDailyUsage,
  remainingFreeMessages,
} from "./dailyMessageLimit";

export function canSendMessage(
  profile: UserProfile,
  emailOverride?: string | null
): boolean {
  const { count } = normalizeDailyUsage(profile);
  return canSendChatMessage(profile, count, emailOverride);
}

export function freeMessagesRemaining(
  profile: UserProfile,
  emailOverride?: string | null
): number {
  const { count } = normalizeDailyUsage(profile);
  return remainingFreeMessages(profile, count, emailOverride);
}

export { FREE_DAILY_MESSAGE_LIMIT };
