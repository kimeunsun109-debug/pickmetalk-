import type { UserDailyPattern } from "@/types";

const KST_OFFSET_MINUTES = 9 * 60;

/** Returns current KST time as minutes-since-midnight (0–1439). */
function kstNowMinute(): number {
  const now = new Date();
  const kst = new Date(now.getTime() + KST_OFFSET_MINUTES * 60_000);
  return kst.getUTCHours() * 60 + kst.getUTCMinutes();
}

function minuteToClock(minute: number): string {
  const hh = Math.floor(minute / 60)
    .toString()
    .padStart(2, "0");
  const mm = (minute % 60).toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

function labelForType(type: UserDailyPattern["patternType"]): string {
  switch (type) {
    case "wake":
      return "기상";
    case "work_start":
      return "출근";
    case "lunch":
      return "점심";
    case "work_end":
      return "퇴근";
    case "exercise":
      return "운동";
    case "sleep":
      return "취침";
    default:
      return type;
  }
}

/**
 * Returns true if the pattern window is active or approaching within the next
 * 60 minutes (based on KST current time).
 */
function isApproachingOrActive(
  nowMinute: number,
  startMinute: number,
  endMinute: number
): boolean {
  const lookahead = 60;
  const windowStart = startMinute - lookahead;

  if (startMinute <= endMinute) {
    return nowMinute >= windowStart && nowMinute <= endMinute;
  }
  // Wraps midnight (e.g., sleep 23:00–01:00)
  return nowMinute >= windowStart || nowMinute <= endMinute;
}

/**
 * Builds a daily-lifestyle-pattern prompt block from the user's inferred
 * patterns. Only patterns with evidenceCount ≥ 2 are shown.
 *
 * If any pattern window is active or approaching in the next 60 minutes,
 * that pattern is explicitly marked so the character can naturally reference it.
 */
export function buildDailyPatternPromptBlock(
  patterns: UserDailyPattern[]
): string {
  const qualified = patterns.filter((p) => p.evidenceCount >= 2);
  if (!qualified.length) return "";

  const nowMinute = kstNowMinute();

  const rows = qualified.slice(0, 4).map((p) => {
    const approaching = isApproachingOrActive(
      nowMinute,
      p.timeStartMinute,
      p.timeEndMinute
    );
    const base = `- ${labelForType(p.patternType)} 추정 ${minuteToClock(p.timeStartMinute)}~${minuteToClock(p.timeEndMinute)} (신뢰도 ${Math.round(p.confidence)}%, 관측 ${p.evidenceCount}회)`;
    return approaching ? `${base} ← 지금 이 시간대` : base;
  });

  return [
    "[생활 패턴 힌트 — 추정치]",
    "아래 패턴은 대화에서 추정된 생활 리듬이다. 정확한 기록처럼 단정하지 말고, 자연스러운 관심 표현으로만 가볍게 활용한다.",
    "절대 금지: '기록에 따르면', '평균', '통계', '데이터상' 같은 감시/리포트 톤.",
    "같은 패턴 멘트 연속 반복 금지. 질문 없이 챙김/공감/여운 마무리도 적극 사용.",
    ...rows,
    "[패턴 활용 멘트 풀(상황 맞을 때 랜덤 사용)]",
    "- 점심 전: '점심시간 다가오네~ 뭐 챙겨 먹을 생각이야?' / '배고플 타이밍이네, 오늘은 뭐 땡겨?'",
    "- 퇴근 전: '조금만 더 버티면 퇴근이네. 오늘도 고생 많았어.' / '퇴근각 보인다, 끝나면 숨부터 돌리자.'",
    "- 취침 전: '이제 슬슬 쉬어도 되겠다. 오늘도 수고했어.' / '밤이 깊어졌네, 오늘은 일찍 눕자.'",
  ].join("\n");
}
