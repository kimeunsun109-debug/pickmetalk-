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

function scoreMemory(memory: ShortTermMemory, userText: string): number {
  const tokens = tokenize(userText);
  if (tokens.length === 0) return 0;

  let score = 0;
  const content = memory.content.toLowerCase();
  for (const token of tokens) {
    if (content.includes(token)) score += 2;
  }

  if (memory.memoryType === "purchase" && /(샀어|구매)/.test(userText)) score += 3;
  if (memory.memoryType === "reminder" && /(챙겼어|했어|완료)/.test(userText))
    score += 2;
  if (memory.memoryType === "mission" && /(했어|완료|끝냈어)/.test(userText))
    score += 2;

  return score;
}

export async function completeMostRelevantShortTermMemory(
  supabase: SupabaseClient,
  userId: string,
  userText: string,
  nowIso = new Date().toISOString()
): Promise<ShortTermMemory | null> {
  const memories = await getActiveShortTermMemories(supabase, userId, nowIso, 12);
  if (memories.length === 0) return null;

  const [best] = memories
    .map((memory) => ({ memory, score: scoreMemory(memory, userText) }))
    .sort((a, b) => b.score - a.score);

  const target = best.score > 0 ? best.memory : memories[0];

  const { error } = await supabase
    .from("short_term_memories")
    .update({ status: "completed", updated_at: nowIso })
    .eq("id", target.id)
    .eq("user_id", userId);

  if (error) return null;
  return target;
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
