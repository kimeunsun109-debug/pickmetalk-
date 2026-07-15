import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { selectCatalogPhoto } from "@/lib/photoCatalog/selectPhoto";
import { NextResponse } from "next/server";

/**
 * GET /api/photos/search?characterId=&category=&emotion=&scenarioId=
 * Service-oriented catalog lookup (authenticated). Used by admin tooling / future UI.
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
  if (!characterId) {
    return NextResponse.json(
      { error: "characterId required" },
      { status: 400 }
    );
  }

  const scenarioId = searchParams.get("scenarioId") ?? "selfie";
  const category = searchParams.get("category");
  const emotion = searchParams.get("emotion");

  // Use admin for catalog reads if available (RLS may hide assets); else user client
  let client = supabase;
  try {
    client = createAdminClient();
  } catch {
    client = supabase;
  }

  const hit = await selectCatalogPhoto(client, {
    characterId,
    scenarioId,
    category: category ?? undefined,
    emotion,
  });

  if (!hit) {
    return NextResponse.json({ photo: null, source: "empty" });
  }

  return NextResponse.json({
    photo: hit,
    source: "catalog",
  });
}
