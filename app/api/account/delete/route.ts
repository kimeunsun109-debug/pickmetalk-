/**
 * DELETE /api/account/delete
 *
 * 계정 삭제 흐름:
 *   1. 현재 로그인 사용자 확인
 *   2. profiles 테이블 삭제 → CASCADE 로 messages · user_character_states 등 자동 삭제
 *   3. SUPABASE_SERVICE_ROLE_KEY 가 있으면 auth.users 까지 삭제 (완전 삭제)
 *      없으면 데이터만 삭제하고 세션 종료 (auth 계정은 관리자 수동 삭제 필요)
 *   4. 세션 종료 (signOut)
 *
 * 응답: { ok: true } | { ok: false, error: string }
 */
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function DELETE() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "로그인 상태가 아닙니다." },
        { status: 401 }
      );
    }

    const userId = user.id;

    // ── Step 1: profiles 삭제 (CASCADE → 모든 관련 데이터 삭제) ──────
    const { error: profileDeleteError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileDeleteError) {
      console.error("[account/delete] profiles delete error:", profileDeleteError);
      // 실패해도 계속 진행 (이미 없을 수 있음)
    }

    // ── Step 2: auth.users 삭제 (서비스 롤 키 필요) ──────────────────
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (serviceRoleKey && supabaseUrl) {
      const admin = createAdminClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { error: authDeleteError } =
        await admin.auth.admin.deleteUser(userId);

      if (authDeleteError) {
        console.error("[account/delete] auth.users delete error:", authDeleteError);
        // auth 삭제 실패해도 데이터는 이미 지워졌으므로 계속
      }
    }

    // ── Step 3: 세션 종료 ──────────────────────────────────────────────
    await supabase.auth.signOut();

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[account/delete] unexpected error:", e);
    return NextResponse.json(
      { ok: false, error: "계정 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
