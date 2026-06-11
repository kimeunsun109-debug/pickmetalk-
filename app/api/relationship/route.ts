import { getConversationForUser } from "@/lib/db/conversations";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/** GET — 대화방별 호감도·관계·감정 상태 */
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
    return NextResponse.json({ state: null });
  }

  return NextResponse.json({
    state: {
      affection: conversation.affection,
      relationshipLevel: conversation.relationshipLevel,
      emotion: conversation.emotion,
      memorySummary: conversation.summary,
      lastChatAt: conversation.lastMessageAt,
      characterId: conversation.characterId,
      conversationId: conversation.id,
    },
  });
}
