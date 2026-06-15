import type { ShortTermMemoryType } from "@/types";

export interface ExtractedShortTermMemory {
  memoryType: ShortTermMemoryType;
  content: string;
  dueDate: string | null;
  expiresAt: string;
  priority: number;
}

const COMPLETION_PATTERN =
  /(했어|했다|완료|끝냈어|끝났다|샀어|구매했어|챙겼어|가져왔어|처리했어|보냈어)/;

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

export function extractShortTermMemory(
  text: string,
  now = new Date()
): ExtractedShortTermMemory | null {
  const trimmed = text.trim();
  if (trimmed.length < 4) return null;
  if (!MEMORY_HINT_PATTERN.test(trimmed)) return null;
  if (COMPLETION_PATTERN.test(trimmed) && trimmed.length < 20) return null;

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
