import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/** 모든 요청에서 Supabase 세션 갱신 (로그인 유지) */
export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
