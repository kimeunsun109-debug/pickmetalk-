import type { PhotoScenario } from "@/lib/photoPush/scenarios";
import type { EmotionState } from "@/types";

const CHARACTER_IDS = ["yuna", "narin", "yoonseo", "eunha", "jiyu"] as const;

/** Interim assets until ~1000 photos/character are imported */
export function defaultAssetUrl(
  characterId: string,
  emotion: EmotionState = "happy"
): string {
  const id = CHARACTER_IDS.includes(characterId as (typeof CHARACTER_IDS)[number])
    ? characterId
    : "yuna";
  return `/assets/characters/${id}/${emotion}.png`;
}

export function assetFingerprint(
  characterId: string,
  scenarioId: string,
  emotion: string
): string {
  return `${characterId}:${scenarioId}:${emotion}`;
}

export interface SelectedPhotoPush {
  scenario: PhotoScenario;
  assetUrl: string;
  assetId: string | null;
  caption: string;
}

export function pickCaption(
  scenario: PhotoScenario,
  usedCaptions: Set<string>,
  displayName: string | null,
  personalize: (t: string, n: string | null | undefined) => string
): string {
  const pool = [...scenario.captions].sort(() => Math.random() - 0.5);
  for (const raw of pool) {
    const cap = personalize(raw, displayName);
    if (!usedCaptions.has(cap)) return cap;
  }
  return personalize(pool[0] ?? scenario.captions[0], displayName);
}
