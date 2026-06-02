import type { RelationshipLevel } from "@/types";
import { affectionToLevel } from "@/services/affection";

export interface RelationshipStage {
  level: RelationshipLevel;
  label: string;
  minAffection: number;
  maxAffection: number;
}

/** 호감도 구간별 관계 단계 라벨 */
export const RELATIONSHIP_STAGES: RelationshipStage[] = [
  { level: 1, label: "어색한 사이", minAffection: 0, maxAffection: 20 },
  { level: 2, label: "친해진 사이", minAffection: 21, maxAffection: 40 },
  { level: 3, label: "썸타는 중", minAffection: 41, maxAffection: 70 },
  { level: 4, label: "연인", minAffection: 71, maxAffection: 90 },
  { level: 5, label: "특별한 사이", minAffection: 91, maxAffection: 100 },
];

export function getRelationshipStage(affection: number): RelationshipStage {
  const level = affectionToLevel(affection);
  return (
    RELATIONSHIP_STAGES.find((s) => s.level === level) ?? RELATIONSHIP_STAGES[0]
  );
}

/** 0~100 호감도 진행 (10칸 막대) */
export function affectionProgressBlocks(affection: number): {
  filled: number;
  total: number;
  percent: number;
} {
  const percent = Math.max(0, Math.min(100, affection));
  const total = 10;
  const filled = Math.round(percent / 10);
  return { filled, total, percent };
}
