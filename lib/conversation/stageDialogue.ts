/**
 * Stage-aware dialogue snippets mapped to product 5-level relationship.
 * Ops used 8 stages — we compress: 1→1, 2-3→2, 4-5→3, 6→4, 7-8→5.
 */

import type { RelationshipLevel } from "@/types";

const DIALOGUE: Record<string, Partial<Record<RelationshipLevel, string[]>>> = {
  thanks: {
    1: ["고마워.", "고마워"],
    2: ["고마워!", "고마워~", "고마워 ㅎㅎ"],
    3: ["헤헤 고마워😊", "고마워~ 설레"],
    4: ["고마워 자기야💕", "고마워~ 사랑해"],
    5: ["역시 내 편은 너밖에 없어❤️", "고마워, 평생 함께하자"],
  },
  miss_you: {
    1: ["오늘 바빠?"],
    2: ["보고 싶어"],
    3: ["보고 싶어~ 많이"],
    4: ["너 없으면 하루가 길어"],
    5: ["매일 보고 싶어, 영원히"],
  },
};

export function pickStageLine(
  topic: keyof typeof DIALOGUE,
  level: RelationshipLevel
): string | null {
  const pool = DIALOGUE[topic]?.[level];
  if (!pool?.length) {
    // Fall back to nearest lower level
    for (let l = level - 1; l >= 1; l--) {
      const alt = DIALOGUE[topic]?.[l as RelationshipLevel];
      if (alt?.length) {
        return alt[Math.floor(Math.random() * alt.length)]!;
      }
    }
    return null;
  }
  return pool[Math.floor(Math.random() * pool.length)]!;
}
