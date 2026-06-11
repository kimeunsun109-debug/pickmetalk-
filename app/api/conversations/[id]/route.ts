import { getConversationForUser } from "@/lib/db/conversations";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/** GET — 대화방 단건 (상태·메타) */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const conversation = await getConversationForUser(supabase, user.id, id);
  if (!conversation) {
    return NextResponse.json({ error: "대화방을 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({ conversation });
}
