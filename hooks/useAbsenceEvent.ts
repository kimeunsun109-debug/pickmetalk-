"use client";

import { ABSENCE_EVENT_DAYS } from "@/lib/constants";

/** lastSeenAt 기준 3일+ 미접속 이벤트 트리거 */
export function useAbsenceEvent(lastSeenAt: string | null) {
  if (!lastSeenAt) return { shouldShow: false, daysAway: 0 };
  const days =
    (Date.now() - new Date(lastSeenAt).getTime()) / (1000 * 60 * 60 * 24);
  return {
    shouldShow: days >= ABSENCE_EVENT_DAYS,
    daysAway: Math.floor(days),
  };
}
