/** 무료 체험·일일 메시지 한도 등 — 비즈니스 규칙 */
export const TRIAL_DAYS = 14;
export const FREE_DAILY_MESSAGE_LIMIT = 30;
export const ABSENCE_EVENT_DAYS = 3;
export const AFFECTION_MAX = 100;
export const RELATIONSHIP_LEVELS = [1, 2, 3, 4, 5] as const;

// ── 재방문 감지 티어 (시간 단위) ──────────────────────────────
/** 1일 이상 미접속 (첫 번째 그리움 표현) */
export const ABSENCE_TIER1_HOURS = 24;
/** 3일 이상 미접속 (걱정·보고싶음 레벨업) */
export const ABSENCE_TIER2_HOURS = 72;
/** 7일 이상 미접속 (재회 이벤트) */
export const ABSENCE_TIER3_HOURS = 168;

/** 호감도 → 관계 레벨 (0~20 Lv1 … 91~100 Lv5) */
export const AFFECTION_TO_LEVEL: Record<number, number> = {
  0: 1,
  21: 2,
  41: 3,
  71: 4,
  91: 5,
};

/** Re-enabled after chat entry stabilization. */
export const ENABLE_SHORT_TERM_MEMORY = true;

/** 웹 검색 (Tavily) — API 키 없으면 자동 비활성 */
export const ENABLE_WEB_SEARCH =
  process.env.ENABLE_WEB_SEARCH !== "false";

export const WEB_SEARCH_MAX_RESULTS = 4;
export const WEB_SEARCH_TIMEOUT_MS = 8000;

/** LLM에 주입하는 최근 대화 메시지 수 (턴) */
export const CHAT_CONTEXT_TURNS = 6;

/**
 * 첫 스트림 청크 지연 시 폴백 전송 (ms).
 * 너무 짧으면 실제 응답이 오기 전에 임시 문장이 떴다가 교체되며 깜빡임이 생긴다.
 * 타이핑 인디케이터가 대기를 가려주므로 진짜 지연(스톨)일 때만 폴백한다.
 */
export const CHAT_STREAM_FIRST_CHUNK_MS = 1800;

/** 웹 검색 대기 상한 — 초과 시 검색 없이 바로 LLM 스트림 */
export const WEB_SEARCH_CHAT_BUDGET_MS = 1200;
