/**
 * POST /api/chat — DeepSeek 스트리밍 응답
 * Body: { characterId, message }
 * @see services/ai/deepseek.ts
 * @see services/memory.ts
 */
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Not implemented", hint: "DeepSeek 스트리밍 연동 예정" },
    { status: 501 }
  );
}
