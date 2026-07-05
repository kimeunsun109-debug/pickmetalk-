import { createClient } from "@/lib/supabase/server";
import { FREE_DAILY_MESSAGE_LIMIT } from "@/lib/constants";
import { mapUserProfile } from "@/lib/db/mappers";
import {
  ensureDailyUsageFresh,
  normalizeDailyUsage,
  remainingFreeMessages,
} from "@/services/dailyMessageLimit";
import { NextResponse } from "next/server";

/** GET /api/profile/usage — today's free message quota */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: row } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!row) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const profile = mapUserProfile(row);
  const { count, needsReset } = normalizeDailyUsage(profile);
  let used = count;
  let isPremium = profile.isPremium;

  if (needsReset) {
    const fresh = await ensureDailyUsageFresh(supabase, user.id, profile);
    used = fresh.count;
    isPremium = fresh.isPremium;
  }

  const remaining = remainingFreeMessages(
    { ...profile, isPremium },
    used
  );

  return NextResponse.json({
    isPremium,
    limit: FREE_DAILY_MESSAGE_LIMIT,
    used,
    remaining: isPremium ? null : remaining,
    subscriptionStatus: (row.subscription_status as string) ?? "free",
  });
}
