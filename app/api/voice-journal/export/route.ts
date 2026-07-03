import { toJournalJsonlLine, type VoiceJournalRow } from "@/lib/db/chatVoiceJournal";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/voice-journal/export
 * 앱 실사용 대화 저널 → jsonl (말투 분석 스크립트용)
 * Query: limit (default 500), since (ISO date YYYY-MM-DD)
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = Math.min(
    2000,
    Math.max(1, parseInt(url.searchParams.get("limit") ?? "500", 10) || 500)
  );
  const since = url.searchParams.get("since");

  let query = supabase
    .from("chat_voice_journal")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (since) {
    query = query.gte("created_at", `${since}T00:00:00.000Z`);
  }

  const { data, error } = await query;

  if (error) {
    if (error.message.includes("chat_voice_journal")) {
      return NextResponse.json(
        {
          error:
            "chat_voice_journal 테이블이 없습니다. supabase migration 007 적용 후 다시 시도하세요.",
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as VoiceJournalRow[];
  const jsonl = rows.map((r) => toJournalJsonlLine(r)).join("\n");
  const format = url.searchParams.get("format");

  if (format === "json") {
    return NextResponse.json({
      count: rows.length,
      entries: rows.map((r) => JSON.parse(toJournalJsonlLine(r))),
    });
  }

  return new NextResponse(jsonl + (jsonl ? "\n" : ""), {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Content-Disposition": `attachment; filename="voice-journal-${user.id.slice(0, 8)}.jsonl"`,
    },
  });
}
