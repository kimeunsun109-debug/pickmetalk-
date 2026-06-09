/**
 * GET  /api/absence-event
 *   ?characterId=narin   → 해당 캐릭터만 체크
 *   (없으면)              → 유저의 모든 캐릭터 일괄 체크
 *
 * 트리거가 발동된 캐릭터는 last_push_sent_at을 즉시 갱신해
 * PUSH_COOLDOWN_HOURS 안에 중복 발송을 방지한다.
 */
import { checkAllAbsenceTriggers, checkAbsenceTrigger } from "@/services/absenceEvent";
import { mapCharacterState } from "@/lib/db/mappers";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { PushEvent } from "@/types";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const characterId = searchParams.get("characterId");

  // ── 단일 캐릭터 체크 ─────────────────────────────────
  if (characterId) {
    const { data, error } = await supabase
      .from("user_character_states")
      .select("*")
      .eq("user_id", user.id)
      .eq("character_id", characterId)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ events: [] });

    const state = mapCharacterState(data);
    const event = checkAbsenceTrigger(state);

    if (event) {
      await markPushSent(supabase, user.id, characterId);
    }

    return NextResponse.json({ events: event ? [event] : [] });
  }

  // ── 전체 캐릭터 일괄 체크 ───────────────────────────
  const { data: rows, error } = await supabase
    .from("user_character_states")
    .select("*")
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!rows || rows.length === 0) return NextResponse.json({ events: [] });

  const states = rows.map(mapCharacterState);
  const events: PushEvent[] = checkAllAbsenceTriggers(states);

  if (events.length > 0) {
    await Promise.all(
      events.map((e) => markPushSent(supabase, user.id, e.characterId))
    );
  }

  return NextResponse.json({ events });
}

// ─────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function markPushSent(supabase: any, userId: string, characterId: string) {
  await supabase
    .from("user_character_states")
    .update({ last_push_sent_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("character_id", characterId);
}
