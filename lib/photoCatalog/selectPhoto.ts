/**
 * Storage bridge — product reads ready photos from Supabase Storage / CDN.
 * Ops (`pickmetalk-ops`) owns generation; product never runs Midjourney.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  EMOTION_FALLBACK_CATEGORIES,
  scenarioToCategory,
} from "./categories";
import type {
  CatalogSelectParams,
  CharacterPhotoAssetRow,
} from "./types";

const DEFAULT_BUCKET = "character-photos";

export function photoStorageBucket(): string {
  return process.env.PHOTO_STORAGE_BUCKET?.trim() || DEFAULT_BUCKET;
}

export function photoCdnBaseUrl(): string | null {
  const base = process.env.PHOTO_CDN_BASE_URL?.trim();
  return base ? base.replace(/\/$/, "") : null;
}

/** Build public URL for a storage path (CDN preferred). */
export function publicUrlForStoragePath(storagePath: string): string {
  const cdn = photoCdnBaseUrl();
  if (cdn) return `${cdn}/${storagePath.replace(/^\//, "")}`;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const bucket = photoStorageBucket();
  if (supabaseUrl) {
    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${storagePath.replace(/^\//, "")}`;
  }
  return storagePath;
}

function mapRow(row: Record<string, unknown>): CharacterPhotoAssetRow {
  return {
    id: String(row.id),
    character_id: String(row.character_id),
    scenario_id: String(row.scenario_id),
    storage_path: String(row.storage_path),
    public_url: (row.public_url as string | null) ?? null,
    category: (row.category as string | null) ?? null,
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    emotion: (row.emotion as string | null) ?? null,
    min_affection: Number(row.min_affection ?? 0),
    min_level: Number(row.min_level ?? 1),
    is_premium: Boolean(row.is_premium),
    is_active: row.is_active === undefined ? true : Boolean(row.is_active),
    season: (row.season as string | null) ?? null,
    time_of_day: (row.time_of_day as string | null) ?? null,
    hash_fingerprint: (row.hash_fingerprint as string | null) ?? null,
    quality_score:
      row.quality_score === null || row.quality_score === undefined
        ? null
        : Number(row.quality_score),
  };
}

function resolveMediaUrl(asset: CharacterPhotoAssetRow): string {
  if (asset.public_url) return asset.public_url;
  return publicUrlForStoragePath(asset.storage_path);
}

/**
 * Select an active catalog photo with fallbacks (category → emotion → any).
 * Returns null if catalog is empty (caller may use emotion PNG placeholder).
 */
export async function selectCatalogPhoto(
  supabase: SupabaseClient,
  params: CatalogSelectParams
): Promise<{
  assetId: string;
  mediaUrl: string;
  fingerprint: string | null;
  category: string;
  emotion: string | null;
} | null> {
  const category =
    params.category ?? scenarioToCategory(params.scenarioId);
  const exclude = params.excludeFingerprints ?? new Set<string>();
  const minLevel = params.minLevel ?? 1;
  const isPremium = params.isPremium ?? false;
  const maxAffection = params.maxAffection;

  const tryQuery = async (filters: {
    scenarioExact?: boolean;
    category?: string;
    emotion?: string | null;
    requireActive?: boolean;
  }) => {
    let q = supabase
      .from("character_photo_assets")
      .select(
        "id, character_id, scenario_id, storage_path, public_url, category, tags, emotion, min_affection, min_level, is_premium, is_active, season, time_of_day, hash_fingerprint, quality_score"
      )
      .eq("character_id", params.characterId)
      .lte("min_level", minLevel);

    if (!isPremium) {
      q = q.eq("is_premium", false);
    }
    if (maxAffection != null) {
      q = q.lte("min_affection", maxAffection);
    }

    if (filters.requireActive !== false) {
      q = q.eq("is_active", true);
    }
    if (filters.scenarioExact) {
      q = q.eq("scenario_id", params.scenarioId);
    }
    if (filters.category) {
      q = q.eq("category", filters.category);
    }
    if (filters.emotion) {
      q = q.eq("emotion", filters.emotion);
    }

    const { data, error } = await q.limit(40);
    if (error || !data?.length) return null;

    const rows = data
      .map((r) => mapRow(r as Record<string, unknown>))
      .filter((r) => !r.hash_fingerprint || !exclude.has(r.hash_fingerprint))
      .sort((a, b) => (b.quality_score ?? 0) - (a.quality_score ?? 0));

    if (!rows.length) return null;
    const pick = rows[Math.floor(Math.random() * Math.min(rows.length, 8))]!;
    return {
      assetId: pick.id,
      mediaUrl: resolveMediaUrl(pick),
      fingerprint: pick.hash_fingerprint,
      category: pick.category ?? category,
      emotion: pick.emotion,
    };
  };

  // 1) exact scenario
  const exact = await tryQuery({ scenarioExact: true });
  if (exact) return exact;

  // 2) category match
  const byCat = await tryQuery({ category });
  if (byCat) return byCat;

  // 3) emotion fallback categories
  const emotion = params.emotion ?? null;
  if (emotion) {
    for (const cat of EMOTION_FALLBACK_CATEGORIES[emotion] ?? []) {
      const hit = await tryQuery({ category: cat, emotion });
      if (hit) return hit;
    }
    const byEmotion = await tryQuery({ emotion });
    if (byEmotion) return byEmotion;
  }

  // 4) any active for character
  const any = await tryQuery({});
  return any;
}
