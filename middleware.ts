/**
 * Supabase 세션 갱신 + 보호 라우트
 * 구현 시: /chat, /gifts 등 (main) 그룹 보호
 */
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
