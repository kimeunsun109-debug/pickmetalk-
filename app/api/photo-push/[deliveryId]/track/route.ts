import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type TrackAction = "open" | "view" | "click";

/**
 * POST /api/photo-push/[deliveryId]/track
 * Body: { action: "open" | "view" | "click" }
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ deliveryId: string }> }
) {
  const { deliveryId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let action: TrackAction = "view";
  try {
    const body = (await request.json()) as { action?: TrackAction };
    if (body.action) action = body.action;
  } catch {
    /* default view */
  }

  const now = new Date().toISOString();
  const patch: Record<string, string> = {};

  if (action === "click" || action === "open") {
    patch.push_clicked_at = now;
    if (action === "open") patch.revisited_at = now;
  }
  if (action === "view") {
    patch.photo_viewed_at = now;
  }

  const { error } = await supabase
    .from("photo_push_deliveries")
    .update(patch)
    .eq("id", deliveryId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("session_logs").insert({
    user_id: user.id,
    event_type:
      action === "click" || action === "open"
        ? "photo_push_opened"
        : "photo_push_viewed",
    metadata: { deliveryId, action },
  });

  return NextResponse.json({ ok: true });
}
