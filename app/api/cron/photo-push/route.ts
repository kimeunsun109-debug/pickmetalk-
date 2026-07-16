import { createAdminClient } from "@/lib/supabase/admin";
import { runPhotoPushCron } from "@/services/photoPush/runner";
import { NextResponse } from "next/server";

/**
 * GET /api/cron/photo-push
 * Vercel Cron — plans daily slots, delivers due photos, sends follow-ups.
 * Requires Authorization: Bearer {CRON_SECRET}
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const result = await runPhotoPushCron(supabase);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "cron failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
