import type { NextRequest } from "next/server";

/** Supabase SSR auth 쿠키 존재 여부 (네트워크 호출 없음) */
export function hasSupabaseAuthCookies(request: NextRequest): boolean {
  return request.cookies.getAll().some(
    (c) => /^sb-.+-auth-token(?:\.\d+)?$/.test(c.name) && c.value.length > 0
  );
}
