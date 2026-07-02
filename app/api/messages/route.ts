import { getConversationForUser } from "@/lib/db/conversations";
import { mapMessage } from "@/lib/db/mappers";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const MESSAGE_LIMIT = 200;

/** GET — 대화방별 최근 메시지 (스크롤 복원용, 최대 200개) */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId");

  if (!conversationId) {
    return NextResponse.json({ error: "conversationId 필요" }, { status: 400 });
  }

  const conversation = await getConversationForUser(
    supabase,
    user.id,
    conversationId
  );
  if (!conversation) {
    return NextResponse.json({ error: "대화방을 찾을 수 없습니다." }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("user_id", user.id)
    .eq("conversation_id", conversationId)
    .in("role", ["user", "assistant"])
    .order("created_at", { ascending: false })
    .limit(MESSAGE_LIMIT);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const messages = (data ?? []).map((row) => mapMessage(row)).reverse();

  return NextResponse.json({ messages });
}
