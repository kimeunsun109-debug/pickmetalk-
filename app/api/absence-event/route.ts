/** GET — 3일+ 미접속 시 특별 이벤트 페이로드 */
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
