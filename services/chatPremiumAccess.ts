import { isWhitelistedUnlimitedChat } from "@/lib/chatUnlimitedWhitelist";
import type { UserProfile } from "@/types";

/** Unlimited chat: paid premium OR server whitelist (env). */
export function hasUnlimitedChatAccess(
  profile: UserProfile,
  emailOverride?: string | null
): boolean {
  if (profile.isPremium) return true;
  return isWhitelistedUnlimitedChat(
    profile.id,
    emailOverride ?? profile.email
  );
}
