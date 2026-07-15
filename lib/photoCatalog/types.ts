/** Product-side photo catalog types (Storage consumer — not Midjourney). */

export type PhotoEmotion =
  | "happy"
  | "sad"
  | "sleepy"
  | "shy"
  | "excited"
  | "tired"
  | "loving"
  | "neutral";

export interface CharacterPhotoAssetRow {
  id: string;
  character_id: string;
  scenario_id: string;
  storage_path: string;
  public_url: string | null;
  category: string | null;
  tags: string[];
  emotion: string | null;
  min_affection: number;
  min_level: number;
  is_premium: boolean;
  is_active: boolean;
  season: string | null;
  time_of_day: string | null;
  hash_fingerprint: string | null;
  quality_score: number | null;
}

export interface CatalogSelectParams {
  characterId: string;
  scenarioId: string;
  emotion?: string | null;
  category?: string | null;
  excludeFingerprints?: Set<string>;
  minLevel?: number;
}
