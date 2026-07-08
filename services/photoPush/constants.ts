/** Photo push business rules */
export const PHOTO_PUSH_MAX_PER_DAY = 2;
export const PHOTO_PUSH_SPECIAL_BONUS_MAX = 1;
export const PHOTO_PUSH_SKIP_DAYS_PER_MONTH_MIN = 1;
export const PHOTO_PUSH_SKIP_DAYS_PER_MONTH_MAX = 2;

/** Engagement score bands → daily send count */
export const PHOTO_PUSH_ENGAGEMENT_HIGH = 65;
export const PHOTO_PUSH_ENGAGEMENT_LOW = 35;

/** Cooldown after low engagement (days) */
export const PHOTO_PUSH_LOW_ENGAGEMENT_COOLDOWN_DAYS = 3;

/** Max hours after a photo send to count a chat reply as photo engagement */
export const PHOTO_PUSH_REPLY_WINDOW_HOURS = 48;

/** Duplicate avoidance window */
export const PHOTO_PUSH_DEDUP_LOOKBACK = 14;

/** Random minute slots (human-like, not on the hour) */
export const PHOTO_PUSH_RANDOM_MINUTE_OFFSETS = [
  3, 7, 12, 18, 22, 27, 33, 38, 41, 47, 52, 58,
] as const;

export const DEFAULT_PHOTO_PUSH_TIMEZONE = "Asia/Seoul";
