"use client";

import { getAbsenceTier, getReturnVisitData, type ReturnVisitData } from "@/lib/returnVisit";

export interface AbsenceEventResult {
  shouldShow: boolean;
  data: ReturnVisitData | null;
  gapHours: number;
}

/**
 * useAbsenceEvent — lastChatAt 기준으로 재방문 티어를 계산한다.
 *
 * @param lastChatAt  마지막 대화 시각 ISO string (null = 미대화)
 * @param characterId 캐릭터 ID (메시지 풀 선택용)
 */
export function useAbsenceEvent(
  lastChatAt: string | null,
  characterId: string
): AbsenceEventResult {
  if (!lastChatAt) {
    return { shouldShow: false, data: null, gapHours: 0 };
  }

  const gapHours = (Date.now() - new Date(lastChatAt).getTime()) / (1000 * 60 * 60);
  const tier = getAbsenceTier(gapHours);

  if (!tier) {
    return { shouldShow: false, data: null, gapHours };
  }

  return {
    shouldShow: true,
    data: getReturnVisitData(characterId, tier),
    gapHours,
  };
}
