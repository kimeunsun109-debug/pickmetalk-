/**
 * POST /api/analytics
 *
 * Body: { event, characterId?, metadata? }
 *
 * session_logs 테이블에 이벤트를 기록한다.
 * 인증 미완료 유저는 user_id = null 로 기록 (익명 이벤트 허용).
 * 응답은 항상 200 — 분석 에러가 UX를 막으면 안 됨.
 */
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { AnalyticsPayload } from "@/services/analytics";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AnalyticsPayload;
    const { event, characterId, metadata } = body;

    if (!event) {
      return NextResponse.json({ ok: false, error: "event required" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from("session_logs").insert({
      user_id: user?.id ?? null,
      character_id: characterId ?? null,
      event_type: event,
      metadata: metadata ?? {},
    });

    return NextResponse.json({ ok: true });
  } catch {
    // 분석 실패는 조용히 무시
    return NextResponse.json({ ok: false });
  }
}
