"use client";

import { normalizeEmotion } from "@/lib/emotions";
import type { EmotionState, RelationshipLevel } from "@/types";
import { useCallback, useEffect, useState } from "react";

/** 호감도·감정·관계 레벨 — /api/relationship 동기화 */
export function useCharacterState(characterId: string | null) {
  const [affection, setAffection] = useState(0);
  const [relationshipLevel, setRelationshipLevel] =
    useState<RelationshipLevel>(1);
  const [emotion, setEmotion] = useState<EmotionState>("happy");
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!characterId) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/relationship?characterId=${characterId}`
      );
      const data = await res.json();
      if (res.ok && data.state) {
        setAffection(data.state.affection);
        setRelationshipLevel(data.state.relationshipLevel);
        setEmotion(normalizeEmotion(data.state.emotion));
      }
    } finally {
      setIsLoading(false);
    }
  }, [characterId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    affection,
    relationshipLevel,
    emotion,
    isLoading,
    refresh,
  };
}
