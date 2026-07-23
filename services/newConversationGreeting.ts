import { completeDeepSeekChat } from "@/lib/ai/deepseek";
import { getCharacterById } from "@/lib/characters/full";
import { postProcessAssistantReply } from "@/services/responsePostProcess";
import { formatGapHours, getSeoulTimeContext } from "@/services/timeContext";
import type { EmotionState } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface NewConversationGreeting {
  message: string;
  emotion: EmotionState;
}

const DEFAULT_GREETING = "안녕! 와줬네 ㅎㅎ 오늘 하루는 어땠어?";
const GREETING_LLM_TIMEOUT_MS = 8000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("greeting timeout")), ms)
    ),
  ]);
}

/**
 * 새 대화방 첫 인사 — 캐릭터가 먼저 말을 건다.
 * 이전 대화방의 기억(요약·마지막 대화)이 있으면 그걸 언급하며 안부를 묻고,
 * 없거나 LLM 호출이 실패하면 캐릭터 기본 첫 인사로 폴백한다.
 */
export async function generateNewConversationGreeting(
  supabase: SupabaseClient,
  userId: string,
  characterId: string,
  conversationId: string
): Promise<NewConversationGreeting> {
  const character = getCharacterById(characterId);
  const emotion: EmotionState = character?.defaultEmotion ?? "happy";
  const fallback =
    character?.personality.firstGreeting?.trim() || DEFAULT_GREETING;

  try {
    const [{ data: prevRows }, { data: profileRow }] = await Promise.all([
      supabase
        .from("conversations")
        .select("summary, last_message_preview, last_message_at")
        .eq("user_id", userId)
        .eq("character_id", characterId)
        .neq("id", conversationId)
        .not("last_message_at", "is", null)
        .order("last_message_at", { ascending: false })
        .limit(1),
      supabase
        .from("profiles")
        .select("display_name")
        .eq("id", userId)
        .maybeSingle(),
    ]);

    const prev = prevRows?.[0] as
      | {
          summary: string | null;
          last_message_preview: string | null;
          last_message_at: string | null;
        }
      | undefined;

    const summary = prev?.summary?.trim() ?? "";
    const lastPreview = prev?.last_message_preview?.trim() ?? "";
    if (!character || (!summary && !lastPreview)) {
      return { message: fallback, emotion };
    }

    const nickname =
      typeof profileRow?.display_name === "string"
        ? profileRow.display_name.trim()
        : "";
    const gapLabel = prev?.last_message_at
      ? formatGapHours(
          (Date.now() - new Date(prev.last_message_at).getTime()) /
            (1000 * 60 * 60)
        )
      : null;
    const seoul = getSeoulTimeContext();

    const systemPrompt = [
      `너는 '${character.name}'이다. ${character.personality.role}`,
      `[말투] ${character.personality.speechStyle}`,
      "",
      "사용자가 방금 새 대화방을 열었다. 네가 먼저 카톡으로 말을 건다.",
      "",
      "[이전 대화 기억]",
      gapLabel ? `- 마지막 대화: 약 ${gapLabel} 전` : "",
      summary
        ? `- 기억 요약 (태그 [work] 등은 분류용이니 그대로 읽지 말 것): ${summary.slice(0, 400)}`
        : "",
      lastPreview ? `- 마지막으로 주고받은 말: ${lastPreview.slice(0, 120)}` : "",
      nickname ? `- 사용자 호칭: ${nickname}` : "",
      `[현재 시각] ${seoul.currentDateTime}`,
      "",
      "[첫 인사 규칙]",
      "- 이전 대화 속 **구체적인 일 하나**를 자연스럽게 챙겨 물어라. 예: '어제 집 수리는 잘 됐어?', '피자 맛있게 먹었다며, 오늘 저녁은 뭐야?'",
      "- 기억에 챙길 만한 구체적인 내용이 없으면, 시간대에 맞는 가볍고 따뜻한 안부로 시작한다.",
      "- 1~3문장. 카카오톡 말투. 질문은 1개만. 괄호 지문·이모지 남발 금지.",
      "- 인사말만 출력한다. 설명·따옴표 없이.",
    ]
      .filter(Boolean)
      .join("\n");

    const raw = await withTimeout(
      completeDeepSeekChat(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: "(새 대화방 입장 — 먼저 인사를 건네줘)" },
        ],
        { maxTokens: 160, temperature: 0.9 }
      ),
      GREETING_LLM_TIMEOUT_MS
    );

    const { text } = postProcessAssistantReply(raw);
    return { message: text.trim() || fallback, emotion };
  } catch {
    return { message: fallback, emotion };
  }
}
