import type {
  ShortTermMemory,
  ShortTermMemoryStatus,
  ShortTermMemoryType,
} from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";

interface ShortTermMemoryRow {
  id: string;
  user_id: string;
  conversation_id: string | null;
  character_id: string | null;
  memory_type: ShortTermMemoryType;
  content: string;
  due_date: string | null;
  expires_at: string;
  status: ShortTermMemoryStatus;
  priority: number;
  source_message_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateShortTermMemoryInput {
  userId: string;
  conversationId: string;
  characterId: string;
  memoryType: ShortTermMemoryType;
  content: string;
  dueDate: string | null;
  expiresAt: string;
  priority: number;
  sourceMessageId: string | null;
}

function mapShortTermMemory(row: ShortTermMemoryRow): ShortTermMemory {
  return {
    id: row.id,
    userId: row.user_id,
    conversationId: row.conversation_id,
    characterId: row.character_id,
    memoryType: row.memory_type,
    content: row.content,
    dueDate: row.due_date,
    expiresAt: row.expires_at,
    status: row.status,
    priority: row.priority,
    sourceMessageId: row.source_message_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function expireShortTermMemories(
  supabase: SupabaseClient,
  userId: string,
  nowIso = new Date().toISOString()
) {
  await supabase
    .from("short_term_memories")
    .update({ status: "expired", updated_at: nowIso })
    .eq("user_id", userId)
    .eq("status", "active")
    .lt("expires_at", nowIso);
}

export async function getActiveShortTermMemories(
  supabase: SupabaseClient,
  userId: string,
  nowIso = new Date().toISOString(),
  limit = 8
): Promise<ShortTermMemory[]> {
  const { data, error } = await supabase
    .from("short_term_memories")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .gt("expires_at", nowIso)
    .order("priority", { ascending: false })
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as ShortTermMemoryRow[]).map(mapShortTermMemory);
}

export async function createShortTermMemory(
  supabase: SupabaseClient,
  input: CreateShortTermMemoryInput
) {
  await supabase.from("short_term_memories").insert({
    user_id: input.userId,
    conversation_id: input.conversationId,
    character_id: input.characterId,
    memory_type: input.memoryType,
    content: input.content,
    due_date: input.dueDate,
    expires_at: input.expiresAt,
    priority: input.priority,
    source_message_id: input.sourceMessageId,
  });
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 2);
}

/**
 * 활성 단기기억과 유저 메시지의 관련도를 점수화한다.
 * 토큰 매칭(2점/토큰) + 동사-타입 보너스로 구성.
 * 최소 점수가 0보다 커야 완료 처리 대상이 된다 (false positive 방지).
 */
function scoreMemory(memory: ShortTermMemory, userText: string): number {
  const tokens = tokenize(userText);
  if (tokens.length === 0) return 0;

  let score = 0;
  const content = memory.content.toLowerCase();
  for (const token of tokens) {
    if (content.includes(token)) score += 2;
  }

  // 타입별 동사 보너스 — 확장된 패턴 포함
  const type = memory.memoryType;
  if (type === "purchase" && /(샀어|샀다|구매했어|사왔어|사왔다)/.test(userText)) score += 4;
  if (type === "health" && /(먹었어|먹었다|마셨어|마셨다|맞았어|맞았다|다녀왔어|다녀왔다)/.test(userText)) score += 4;
  if (type === "weather" && /(챙겼어|챙겼다|챙겨왔어|우산\s*챙)/.test(userText)) score += 4;
  if (type === "reminder" && /(챙겼어|했어|완료|처리했어|됐어|됐다)/.test(userText)) score += 2;
  if (type === "mission" && /(했어|완료|끝냈어|끝났다|해결했어)/.test(userText)) score += 2;
  if (type === "follow_up" && /(갔어|갔다|만났어|다녀왔어|받았어|받았다)/.test(userText)) score += 3;

  // 일반 완료 동사 추가 보너스 (타입 무관)
  if (/(다녀왔어|다녀왔다|도착했어|도착했다)/.test(userText)) score += 2;
  if (/(갔어|갔다|갔음)/.test(userText)) score += 1;
  if (/(예약했어|예약했다|예약했음)/.test(userText)) score += 2;

  return score;
}

/**
 * 유저 메시지와 가장 관련 있는 활성 단기기억을 완료 처리한다.
 * 관련 메모리가 없으면(score === 0) 아무것도 완료하지 않는다.
 */
export async function completeMostRelevantShortTermMemory(
  supabase: SupabaseClient,
  userId: string,
  userText: string,
  nowIso = new Date().toISOString()
): Promise<ShortTermMemory | null> {
  const memories = await getActiveShortTermMemories(supabase, userId, nowIso, 12);
  if (memories.length === 0) return null;

  const scored = memories
    .map((memory) => ({ memory, score: scoreMemory(memory, userText) }))
    .sort((a, b) => b.score - a.score);

  const [best] = scored;

  // score가 0이면 관련 메모리가 없는 것 — 완료하지 않고 null 반환
  if (best.score === 0) return null;

  const { error } = await supabase
    .from("short_term_memories")
    .update({ status: "completed", updated_at: nowIso })
    .eq("id", best.memory.id)
    .eq("user_id", userId);

  if (error) return null;
  return best.memory;
}

function formatDue(memory: ShortTermMemory): string {
  if (!memory.dueDate) return "가까운 시일 안에";
  return new Date(memory.dueDate).toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

export function buildShortTermMemoryContextBlock(
  memories: ShortTermMemory[]
): string {
  if (memories.length === 0) return "";

  const lines = memories.map(
    (memory) =>
      `- (${memory.memoryType}, 우선순위 ${memory.priority}, ${formatDue(memory)}까지) ${memory.content}`
  );

  return [
    "[단기기억: 오늘/내일/이번 주에만 자연스럽게 챙길 것]",
    "아래 항목은 사용자가 가까운 시일에 신경 쓰는 일입니다. 감시하듯 반복하지 말고, 대화 흐름에 맞을 때 다정하게 한 번 챙겨주세요. 완료/만료된 항목처럼 말하지 마세요.",
    ...lines,
  ].join("\n");
}

/**
 * 기한이 지나거나(status=expired) 오늘/내일이 기한인(status=active) 단기기억을 반환한다.
 * 대화 중 캐릭터가 자연스럽게 follow-up 할 수 있도록 강화 힌트에 사용된다.
 *
 * - active AND due_date <= now+24h: 오늘 안에 처리돼야 할 것
 * - expired AND due_date >= now-48h: 최근 기한이 지난 것 (follow-up 아직 적절)
 */
export async function getUrgentFollowUpMemories(
  supabase: SupabaseClient,
  userId: string,
  nowIso = new Date().toISOString(),
  limit = 3
): Promise<ShortTermMemory[]> {
  const now = new Date(nowIso);
  const within24h = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  const ago48h = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();

  const [{ data: expiredData }, { data: dueData }] = await Promise.all([
    supabase
      .from("short_term_memories")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "expired")
      .not("due_date", "is", null)
      .gte("due_date", ago48h)
      .order("priority", { ascending: false })
      .order("due_date", { ascending: false })
      .limit(limit),

    supabase
      .from("short_term_memories")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .not("due_date", "is", null)
      .lte("due_date", within24h)
      .order("priority", { ascending: false })
      .order("due_date", { ascending: true })
      .limit(limit),
  ]);

  const combined = [
    ...((expiredData ?? []) as ShortTermMemoryRow[]).map(mapShortTermMemory),
    ...((dueData ?? []) as ShortTermMemoryRow[]).map(mapShortTermMemory),
  ];

  const seen = new Set<string>();
  return combined
    .filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    })
    .slice(0, limit);
}

/**
 * 단기기억 타입과 내용에 맞는 follow-up 질문 힌트를 생성한다.
 * 감시하듯 지시하지 않고 캐릭터가 자연스럽게 물어볼 수 있도록 가이드한다.
 */
export function buildTypeFollowUpHint(memory: ShortTermMemory): string {
  const c = memory.content;
  const type = memory.memoryType;

  if (type === "health") {
    if (/병원|진료|검사|치과/.test(c)) return `"${c.slice(0, 40)}" — 병원 다녀왔어? 결과는 어땠어?`;
    if (/약|복약|처방/.test(c)) return `"${c.slice(0, 40)}" — 약은 잘 챙겨 먹고 있어?`;
    if (/운동|헬스|조깅/.test(c)) return `"${c.slice(0, 40)}" — 오늘 운동했어?`;
    return `"${c.slice(0, 40)}" — 몸 상태는 좀 어때?`;
  }

  if (type === "follow_up") {
    if (/면접|인터뷰/.test(c)) return `"${c.slice(0, 40)}" — 면접 결과는 어떻게 됐어?`;
    if (/시험|토익|토플|수능|자격증/.test(c)) return `"${c.slice(0, 40)}" — 시험 어떻게 봤어?`;
    if (/병원|진료/.test(c)) return `"${c.slice(0, 40)}" — 병원 다녀왔어? 괜찮아?`;
    if (/약속|만남|미팅/.test(c)) return `"${c.slice(0, 40)}" — 약속은 잘 됐어?`;
    return `"${c.slice(0, 40)}" — 어떻게 됐어?`;
  }

  if (type === "mission") {
    return `"${c.slice(0, 40)}" — 미션 완수했어?`;
  }

  if (type === "reminder") {
    if (/예약|신청|제출|마감/.test(c)) return `"${c.slice(0, 40)}" — 제때 처리했어?`;
    return `"${c.slice(0, 40)}" — 잊지 않고 했어?`;
  }

  if (type === "purchase") {
    return `"${c.slice(0, 40)}" — 샀어?`;
  }

  if (type === "weather") {
    return `"${c.slice(0, 40)}" — 우산 챙겼어?`;
  }

  return `"${c.slice(0, 40)}" — 어떻게 됐어?`;
}

/**
 * 기한이 임박하거나 만료된 단기기억에 대한 강화 follow-up 힌트 블록.
 * 일반 단기기억 블록보다 우선순위가 높고, 타입별 구체적인 질문을 제안한다.
 */
export function buildUrgentFollowUpBlock(memories: ShortTermMemory[]): string {
  if (memories.length === 0) return "";

  const hints = memories.map((m) => `- ${buildTypeFollowUpHint(m)}`);
  return [
    "[오늘 대화 중 자연스럽게 한 번 챙겨봐야 할 것 — 우선순위 높음]",
    "아래 항목들은 기한이 오늘까지이거나 이미 지난 것들이야. 감시하듯 다그치지 말고, 대화 흐름에서 적절한 타이밍에 다정하게 한 번만 물어봐.",
    ...hints,
  ].join("\n");
}
