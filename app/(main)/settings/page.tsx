import { mapUserProfile } from "@/lib/db/mappers";
import { createClient } from "@/lib/supabase/server";
import { ensureDailyUsageFresh, normalizeDailyUsage } from "@/services/dailyMessageLimit";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, { data: ucsRows }, { data: sessionRows }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase
        .from("user_character_states")
        .select("character_id, affection, relationship_level, last_chat_at")
        .eq("user_id", user.id)
        .order("last_chat_at", { ascending: false }),
      supabase
        .from("session_logs")
        .select("created_at")
        .eq("user_id", user.id)
        .eq("event_type", "session_start")
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

  const joinedDaysAgo = profile?.created_at
    ? Math.floor(
        (Date.now() - new Date(profile.created_at).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  let todayMsgCount = 0;
  let isPremium = false;
  let subscriptionStatus = "free";

  if (profile) {
    const mapped = mapUserProfile(profile);
    subscriptionStatus = mapped.subscriptionStatus;
    const { count, needsReset } = normalizeDailyUsage(mapped);
    if (needsReset) {
      const fresh = await ensureDailyUsageFresh(supabase, user.id, mapped);
      todayMsgCount = fresh.count;
      isPremium = fresh.isPremium;
    } else {
      todayMsgCount = count;
      isPremium = mapped.isPremium;
    }
  }

  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-ivory px-4 pb-24 pt-10">
          <p className="text-sm text-gray-400">설정 불러오는 중…</p>
        </main>
      }
    >
      <SettingsClient
        email={user.email ?? ""}
        joinedDaysAgo={joinedDaysAgo}
        characterStates={ucsRows ?? []}
        todayMsgCount={todayMsgCount}
        isPremium={isPremium}
        subscriptionStatus={subscriptionStatus}
        sessionDates={(sessionRows ?? []).map((r) => r.created_at)}
      />
    </Suspense>
  );
}
