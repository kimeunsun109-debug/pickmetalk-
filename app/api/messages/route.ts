import { mapMessage } from "@/lib/db/mappers";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const MESSAGE_LIMIT = 30;

/** GET — 최근 메시지 30개 (user/assistant만) */
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

  if (!characterId) {
    return NextResponse.json({ error: "characterId 필요" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("user_id", user.id)
    .eq("character_id", characterId)
    .in("role", ["user", "assistant"])
    .order("created_at", { ascending: false })
    .limit(MESSAGE_LIMIT);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const messages = (data ?? [])
    .map((row) => mapMessage(row))
    .reverse();

  return NextResponse.json({ messages });
}
