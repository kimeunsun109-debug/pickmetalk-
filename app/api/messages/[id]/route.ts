import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/** DELETE 사용자 본인의 메시지 삭제. user/assistant 메시지 모두 지원합니다. */
export async function DELETE(
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

  const { data: message, error: findError } = await supabase
    .from("messages")
    .select("id, role")
    .eq("id", id)
    .eq("user_id", user.id)
    .in("role", ["user", "assistant"])
    .maybeSingle();

  if (findError) {
    return NextResponse.json({ error: findError.message }, { status: 500 });
  }

  if (!message) {
    return NextResponse.json(
      { error: "메시지를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  const { error } = await supabase
    .from("messages")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
