/**
 * 설정 — 사용자 테스트 통계 대시보드
 *
 * 베타 v1 표시 항목:
 *   - 가입일 / 이용 일수
 *   - 현재 캐릭터 + 호감도
 *   - 오늘 메시지 사용량
 *   - 다음 접속 예상 인사말 (재방문 티어 예고)
 */
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 프로필 + 현재 캐릭터 상태
  const [{ data: profile }, { data: ucsRows }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("user_character_states")
      .select("character_id, affection, relationship_level, last_chat_at")
      .eq("user_id", user.id)
      .order("last_chat_at", { ascending: false }),
  ]);

  // 오늘 보낸 메시지 수
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { count: todayMsgCount } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("role", "user")
    .gte("created_at", todayStart.toISOString());

  // 재방문 통계 — 다음날 복귀 여부
  const { data: sessionRows } = await supabase
    .from("session_logs")
    .select("created_at")
    .eq("user_id", user.id)
    .eq("event_type", "session_start")
    .order("created_at", { ascending: false })
    .limit(30);

  const joinedDaysAgo = profile?.created_at
    ? Math.floor(
        (Date.now() - new Date(profile.created_at).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  return (
    <SettingsClient
      email={user.email ?? ""}
      joinedDaysAgo={joinedDaysAgo}
      characterStates={ucsRows ?? []}
      todayMsgCount={todayMsgCount ?? 0}
      sessionDates={(sessionRows ?? []).map((r) => r.created_at)}
    />
  );
}
