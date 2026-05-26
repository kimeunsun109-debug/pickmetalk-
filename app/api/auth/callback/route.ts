/** Supabase OAuth / 이메일 확인 콜백 */
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
}
