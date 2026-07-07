import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/** POST — 이 기기를 활성 세션으로 등록 (다른 기기 접속 끊김) */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  let body: { sessionId?: string };
  try {
    body = (await request.json()) as { sessionId?: string };
  } catch {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }

  const sessionId = body.sessionId?.trim();
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId 필요" }, { status: 400 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ active_device_session: sessionId })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, sessionId });
}

/** GET — 현재 기기 세션이 유효한지 확인 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  const sessionId = request.headers.get("x-device-session")?.trim();
  if (!sessionId) {
    return NextResponse.json({ valid: true });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("active_device_session")
    .eq("id", user.id)
    .maybeSingle();

  const active = (profile?.active_device_session as string | null) ?? null;
  if (!active) {
    return NextResponse.json({ valid: true });
  }

  return NextResponse.json({ valid: active === sessionId });
}
