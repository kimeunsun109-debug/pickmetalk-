/**
 * analytics.ts — 사용자 테스트 로그 수집
 *
 * 기록 항목 (베타 v1):
 *   session_start          앱/채팅 화면 진입
 *   character_selected     캐릭터 선택
 *   message_sent           메시지 전송
 *   return_visit_tier1     24h 만의 재방문
 *   return_visit_tier2     3d 만의 재방문
 *   return_visit_tier3     7d 만의 재방문
 *   absence_banner_shown   재방문 배너 표시
 *   absence_banner_dismissed 재방문 배너 닫기
 *
 * - fire-and-forget: 에러가 발생해도 UX를 절대 막지 않는다.
 * - 서버 사이드에서는 직접 supabase.insert 를 쓰면 된다.
 */

export type AnalyticsEvent =
  | "session_start"
  | "character_selected"
  | "message_sent"
  | "message_copy"
  | "message_share"
  | "message_like"
  | "message_dislike"
  | "return_visit_tier1"
  | "return_visit_tier2"
  | "return_visit_tier3"
  | "absence_banner_shown"
  | "absence_banner_dismissed"
  | "photo_push_sent"
  | "photo_push_opened"
  | "photo_push_viewed"
  | "photo_push_replied";

export interface AnalyticsPayload {
  event: AnalyticsEvent;
  characterId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * 클라이언트 사이드 이벤트 트래킹.
 * POST /api/analytics 로 전송 후 즉시 리턴 (await 불필요).
 */
export function trackEvent(
  event: AnalyticsEvent,
  characterId?: string,
  metadata?: Record<string, unknown>
): void {
  const payload: AnalyticsPayload = { event, characterId, metadata };
  // 네트워크 에러가 UX를 막으면 안 됨 — Promise 무시
  fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {
    /* silently ignore */
  });
}
