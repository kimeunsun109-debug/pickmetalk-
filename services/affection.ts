import { AFFECTION_MAX, AFFECTION_TO_LEVEL } from "@/lib/constants";
import type { RelationshipLevel } from "@/types";

export function clampAffection(value: number): number {
  return Math.max(0, Math.min(AFFECTION_MAX, value));
}

export function affectionToLevel(affection: number): RelationshipLevel {
  let level = 1 as RelationshipLevel;
  for (const [threshold, lv] of Object.entries(AFFECTION_TO_LEVEL)) {
    if (affection >= Number(threshold)) level = lv as RelationshipLevel;
  }
  return level;
}
