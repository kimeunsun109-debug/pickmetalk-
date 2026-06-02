/** 무료 체험·일일 메시지 한도 등 — 비즈니스 규칙 */
export const TRIAL_DAYS = 14;
export const FREE_DAILY_MESSAGE_LIMIT = 30;
export const ABSENCE_EVENT_DAYS = 3;
export const AFFECTION_MAX = 100;
export const RELATIONSHIP_LEVELS = [1, 2, 3, 4, 5] as const;

/** 호감도 → 관계 레벨 (0~20 Lv1 … 91~100 Lv5) */
export const AFFECTION_TO_LEVEL: Record<number, number> = {
  0: 1,
  21: 2,
  41: 3,
  71: 4,
  91: 5,
};
