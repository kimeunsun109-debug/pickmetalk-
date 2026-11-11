/**
 * DELETE /api/account/delete
 *
 * 계정 삭제 흐름:
 *   1. 현재 로그인 사용자 확인
 *   2. 서비스 롤 설정 확인 (인증 계정까지 삭제해야 완전한 탈퇴 가능)
 *   3. profiles 테이블 삭제 → CASCADE 로 messages · user_character_states 등 자동 삭제
 *   4. auth.users 삭제 후 세션 종료 (signOut)
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
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceRoleKey || !supabaseUrl) {
      console.error(
        "[account/delete] missing service role configuration; refusing partial deletion"
      );
      return NextResponse.json(
        {
          ok: false,
          error:
            "계정 삭제 기능이 현재 준비되지 않았습니다. 잠시 후 다시 시도해 주세요.",
        },
        { status: 503 }
      );
    }

    const { error: profileDeleteError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileDeleteError) {
      console.error("[account/delete] profiles delete error:", profileDeleteError);
      return NextResponse.json(
        { ok: false, error: "계정 데이터 삭제에 실패했습니다. 다시 시도해 주세요." },
        { status: 500 }
      );
    }

    const admin = createAdminClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error: authDeleteError } = await admin.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error("[account/delete] auth.users delete error:", authDeleteError);
      await supabase.auth.signOut();
      return NextResponse.json(
        {
          ok: false,
          error:
            "계정 데이터는 삭제됐지만 인증 계정 삭제에 실패했습니다. 고객센터에 문의해 주세요.",
        },
        { status: 502 }
      );
    }

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
