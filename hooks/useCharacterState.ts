"use client";

/** 호감도·감정·관계 레벨 — /api/relationship 동기화 예정 */
export function useCharacterState(_characterId: string) {
  return {
    affection: 0,
    relationshipLevel: 1,
    emotion: "happy" as const,
    isLoading: true,
  };
}
