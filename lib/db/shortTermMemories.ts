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
