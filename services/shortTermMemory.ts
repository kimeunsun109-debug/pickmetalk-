import type { ShortTermMemoryType } from "@/types";

export interface ExtractedShortTermMemory {
  memoryType: ShortTermMemoryType;
  content: string;
  dueDate: string | null;
  expiresAt: string;
  priority: number;
}

/**
 * 단기기억 완료를 나타내는 한국어 동사 패턴.
 * 과거형으로 '완료했음'을 의미하는 동사를 포괄적으로 포함한다.
 */
const COMPLETION_PATTERN =
  /(했어|했다|완료|끝냈어|끝났다|샀어|구매했어|챙겼어|가져왔어|처리했어|보냈어|먹었어|먹었다|먹었음|마셨어|마셨다|갔어|갔다|갔음|다녀왔어|다녀왔다|받았어|받았다|받았음|도착했어|도착했다|맞았어|맞았다|됐어|됐다|됐음|나왔어|나왔다|만났어|만났다|사왔어|사왔다|해결했어|해결했다|고쳤어|고쳤다|예약했어|예약했다|예약했음|찾았어|찾았다)/;

const MEMORY_HINT_PATTERN =
  /(오늘|내일|모레|이번\s*주|저녁|아침|출근|퇴근|이따|나중에|챙겨|사야|해야|할\s*일|미션|감사한\s*일|우산|비\s*온|병원|약|운동)/;

function endOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function endOfThisWeek(now: Date): Date {
  const day = now.getDay();
  const daysUntilSunday = (7 - day) % 7;
  const target = new Date(now);
  target.setDate(now.getDate() + daysUntilSunday);
  return endOfDay(target);
}

function addDays(now: Date, days: number): Date {
  const target = new Date(now);
  target.setDate(now.getDate() + days);
  return target;
}

function resolveWindow(text: string, now: Date) {
  if (/이번\s*주/.test(text)) {
    const due = endOfThisWeek(now);
    return { dueDate: due.toISOString(), expiresAt: due.toISOString() };
  }

  if (/모레/.test(text)) {
    const due = endOfDay(addDays(now, 2));
    return { dueDate: due.toISOString(), expiresAt: due.toISOString() };
  }

  if (/내일/.test(text)) {
    const due = endOfDay(addDays(now, 1));
    return { dueDate: due.toISOString(), expiresAt: due.toISOString() };
  }

  if (/(오늘|이따|저녁|아침|출근|퇴근)/.test(text)) {
    const due = endOfDay(now);
    return { dueDate: due.toISOString(), expiresAt: due.toISOString() };
  }

  const fallback = addDays(now, 1);
  return { dueDate: null, expiresAt: fallback.toISOString() };
}

function detectType(text: string): ShortTermMemoryType {
  if (/(우산|비\s*온|비가|날씨)/.test(text)) return "weather";
  if (/(사야|구매|충전기|마트|편의점|주문)/.test(text)) return "purchase";
  if (/(병원|약|몸살|아파|운동|건강)/.test(text)) return "health";
  if (/감사한\s*일|감사\s*3/.test(text)) return "gratitude";
  if (/미션/.test(text)) return "mission";
  if (/(물어봐|확인해|어땠는지|후기)/.test(text)) return "follow_up";
  return "reminder";
}

function priorityForType(type: ShortTermMemoryType, text: string): number {
  if (/(꼭|중요|반드시|잊지)/.test(text)) return 5;
  if (type === "health" || type === "weather") return 4;
  if (type === "reminder" || type === "purchase") return 3;
  return 2;
}

function normalizeContent(text: string): string {
  return text
    .replace(/^(나|내가|오빠|오늘|내일|모레|이번\s*주)\s*/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

export function isShortTermCompletionMessage(text: string): boolean {
  return COMPLETION_PATTERN.test(text);
}

/**
 * 완료 동사가 특정 메모리 타입과 얼마나 연관이 있는지 가중치를 반환한다.
 * completeMostRelevantShortTermMemory 의 scoreMemory 에서 활용.
 */
export function getCompletionVerbBonus(
  text: string,
  memoryType: ShortTermMemoryType
): number {
  // 가장 명확한 완료 동사
  if (/(다녀왔어|다녀왔다|도착했어|도착했다)/.test(text)) {
    return memoryType === "health" || memoryType === "reminder" ? 4 : 3;
  }
  if (/(먹었어|먹었다|마셨어|마셨다|맞았어|맞았다)/.test(text)) {
    return memoryType === "health" ? 5 : 2;
  }
  if (/(샀어|구매했어|사왔어|사왔다)/.test(text)) {
    return memoryType === "purchase" ? 5 : 2;
  }
  if (/(갔어|갔다|갔음)/.test(text)) {
    return 2;
  }
  if (/(받았어|받았다|받았음)/.test(text)) {
    return 3;
  }
  if (/(예약했어|예약했다|예약했음)/.test(text)) {
    return 4;
  }
  if (/(만났어|만났다)/.test(text)) {
    return 2;
  }
  // 일반 완료 동사 (했어, 완료, 챙겼어 등)
  if (/(했어|했다|완료|챙겼어|처리했어|끝냈어|끝났다|해결했어|됐어|됐다)/.test(text)) {
    return 2;
  }
  return 1;
}

export function extractShortTermMemory(
  text: string,
  now = new Date()
): ExtractedShortTermMemory | null {
  const trimmed = text.trim();
  if (trimmed.length < 4) return null;
  if (!MEMORY_HINT_PATTERN.test(trimmed)) return null;
  // 짧은 완료 메시지는 새 단기기억 추출 억제 (이미 한 일을 표현하는 경우)
  // 긴 메시지(>=12자)는 미래 일정이 함께 포함될 수 있으므로 추출 허용
  if (COMPLETION_PATTERN.test(trimmed) && trimmed.length < 12) return null;

  const memoryType = detectType(trimmed);
  const { dueDate, expiresAt } = resolveWindow(trimmed, now);
  const content = normalizeContent(trimmed);

  if (content.length < 3) return null;

  return {
    memoryType,
    content,
    dueDate,
    expiresAt,
    priority: priorityForType(memoryType, trimmed),
  };
}
