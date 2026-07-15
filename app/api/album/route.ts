import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/album?characterId=yuna
 * Returns memory album items (photos sent via photo push), grouped by album_label.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const characterId = searchParams.get("characterId");
  const limit = Math.min(Number(searchParams.get("limit") ?? 60), 120);

  let query = supabase
    .from("memory_album_items")
    .select(
      "id, character_id, media_url, caption, category, album_label, sent_at, delivery_id"
    )
    .eq("user_id", user.id)
    .order("sent_at", { ascending: false })
    .limit(limit);

  if (characterId) {
    query = query.eq("character_id", characterId);
  }

  const { data, error } = await query;
  if (error) {
    // Fallback: derive from deliveries if album table missing
    if (error.message.includes("memory_album_items") || error.code === "42P01") {
      return await albumFromDeliveries(supabase, user.id, characterId, limit);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const groups = groupByLabel(data ?? []);
  return NextResponse.json({ items: data ?? [], groups });
}

async function albumFromDeliveries(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  characterId: string | null,
  limit: number
) {
  let q = supabase
    .from("photo_push_deliveries")
    .select("id, character_id, media_url, caption, sent_at, scenario_id, metadata")
    .eq("user_id", userId)
    .order("sent_at", { ascending: false })
    .limit(limit);
  if (characterId) q = q.eq("character_id", characterId);

  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = (data ?? []).map((d) => {
    const meta = (d.metadata ?? {}) as { category?: string };
    const category = meta.category ?? "selfie";
    return {
      id: d.id,
      character_id: d.character_id,
      media_url: d.media_url,
      caption: d.caption,
      category,
      album_label: "추억",
      sent_at: d.sent_at,
      delivery_id: d.id,
    };
  });

  return NextResponse.json({ items, groups: groupByLabel(items) });
}

function groupByLabel(
  items: Array<{ album_label: string; [k: string]: unknown }>
) {
  const map = new Map<string, typeof items>();
  for (const item of items) {
    const label = item.album_label || "추억";
    const list = map.get(label) ?? [];
    list.push(item);
    map.set(label, list);
  }
  return Array.from(map.entries()).map(([label, photos]) => ({
    label,
    count: photos.length,
    photos,
  }));
}
