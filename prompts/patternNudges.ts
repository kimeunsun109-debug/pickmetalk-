import type { UserDailyPattern } from "@/types";

const MIN_PATTERN_CONFIDENCE = 60;
const KST_OFFSET_MINUTES = 9 * 60;

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
 * 현재 KST 분(0~1439)이 패턴 창 내에 있는지 확인한다.
 * sleep 패턴처럼 자정을 걸치는 창(start > end)도 처리한다.
 */
function isInWindow(start: number, end: number, nowKST: number): boolean {
  if (start <= end) return nowKST >= start && nowKST <= end;
  return nowKST >= start || nowKST <= end;
}

/**
 * UTC Date → KST 분(0~1439)
 */
export function minuteFromDateInKst(date: Date): number {
  const kst = new Date(date.getTime() + KST_OFFSET_MINUTES * 60_000);
  return kst.getUTCHours() * 60 + kst.getUTCMinutes();
}

/**
 * 유저의 생활 패턴을 LLM 시스템 프롬프트 블록으로 변환한다.
 *
 * @param patterns  DB에서 가져온 UserDailyPattern 배열 (신뢰도 내림차순 권장)
 * @param nowKSTMinute  현재 KST 분(0~1439). 미제공 시 활성 창 표시 생략.
 */
export function buildDailyPatternPromptBlock(
  patterns: UserDailyPattern[],
  nowKSTMinute?: number
): string {
  const significant = patterns
    .filter((p) => p.confidence >= MIN_PATTERN_CONFIDENCE)
    .slice(0, 4);

  if (significant.length === 0) return "";

  const activeLabels: string[] = [];
  const rows = significant.map((p) => {
    const label = labelForType(p.patternType);
    const timeStr = `${minuteToClock(p.timeStartMinute)}~${minuteToClock(p.timeEndMinute)}`;
    const active =
      nowKSTMinute !== undefined &&
      isInWindow(p.timeStartMinute, p.timeEndMinute, nowKSTMinute);
    if (active) activeLabels.push(label);
    return `- ${label}: 보통 ${timeStr}${active ? " (지금 이 시간대)" : ""}`;
  });

  const lines = [
    "[생활 패턴 힌트 — 대화에 자연스럽게만 활용]",
    "아래는 대화에서 추론된 생활 리듬이다. 단정·보고 톤 금지 ('기록에 따르면', '평균', '통계' 등). 가볍게 챙기는 맥락에서만 1~2번 활용한다.",
    ...rows,
  ];

  if (activeLabels.length > 0) {
    lines.push(
      `※ 현재 [${activeLabels.join(", ")}] 시간대 — 자연스럽게 언급 가능. 강요 금지.`
    );
  }

  return lines.join("\n");
}
