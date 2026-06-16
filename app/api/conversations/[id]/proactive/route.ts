import { runProactiveMessageFlow } from "@/lib/proactiveMessage";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/** POST — 채팅방 진입 시 캐릭터 선제 메시지 삽입 (중복·쿨다운 적용) */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const result = await runProactiveMessageFlow(
      supabase,
      user.id,
      conversationId
    );
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "선제 메시지 처리 실패";
    return NextResponse.json({ error: msg, inserted: false }, { status: 500 });
  }
}
