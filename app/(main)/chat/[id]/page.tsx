import { ChatErrorBoundary } from "@/components/chat/ChatErrorBoundary";
import { ChatScreen } from "@/components/chat/ChatScreen";
import { ChatProvider, type ChatMessage } from "@/contexts/ChatProvider";
import { getCharacterById } from "@/lib/characters/full";
import { toPublicCharacter } from "@/lib/characters/public";
import {
  createConversation,
  getConversationForCharacter,
  getConversationForUser,
  getOrCreateRecentConversation,
  touchCharacterSelection,
} from "@/lib/db/conversations";
import { fetchConversationMessages } from "@/lib/db/messages";
import { updateConversationLastMessage } from "@/lib/db/updateConversationPreview";
import {
  characterChatPath,
  isCharacterId,
  isConversationUuid,
  resolveCharacterId,
} from "@/lib/chatRoute";
import { normalizeEmotion } from "@/lib/emotions";
import { ServerPerfTrace } from "@/lib/perf/trace";
import { createClient } from "@/lib/supabase/server";
import { isWhitelistedUnlimitedChat } from "@/lib/chatUnlimitedWhitelist";
import type { Conversation, EmotionState, RelationshipLevel } from "@/types";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * /chat/[id]
 *   - id = 캐릭터 (yuna, narin, …) → 해당 캐릭터 최근 대화방
 *   - id = UUID → characterId URL로 정규화 리다이렉트
 *   - ?conversationId= — 특정 대화방 (characterId와 일치해야 함)
 */
export default async function ChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ conversationId?: string; photoPush?: string }>;
}) {
  const trace = new ServerPerfTrace("Enter Chat — SSR");
  const { id } = await params;
  const { conversationId: queryConversationId, photoPush } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  trace.mark("Auth getUser");

  if (!user) redirect("/login");

  if (isConversationUuid(id)) {
    const conv = await getConversationForUser(supabase, user.id, id);
    if (!conv) {
      return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
          <p className="text-sm text-gray-600">대화방을 찾을 수 없습니다.</p>
          <Link
            href="/conversations"
            className="rounded-full bg-pink-accent px-6 py-2 text-sm text-white"
          >
            대화 목록으로
          </Link>
        </main>
      );
    }
    redirect(characterChatPath(conv.characterId, conv.id));
  }

  const characterId = isCharacterId(id) ? id : resolveCharacterId(id);
  const character = getCharacterById(characterId);
  trace.mark("Load Character", characterId);
  if (!character) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <p className="text-sm text-gray-600">캐릭터 정보를 불러오지 못했습니다.</p>
        <Link
          href="/characters"
          className="rounded-full bg-pink-accent px-6 py-2 text-sm text-white"
        >
          캐릭터 선택
        </Link>
      </main>
    );
  }

  const resolveConversation = async () => {
    if (queryConversationId) {
      const matched = await getConversationForCharacter(
        supabase,
        user.id,
        characterId,
        queryConversationId
      );
      if (matched) return matched;
    }
    return getOrCreateRecentConversation(supabase, user.id, characterId);
  };

  let conversation: Conversation;
  let profileRow: { is_premium?: boolean; display_name?: string | null } | null =
    null;
  let initialMessages: ChatMessage[] = [];

  try {
    const [convResult, profileResult] = await trace.span(
      "Resolve conversation + profile",
      () =>
        Promise.all([
          resolveConversation(),
          supabase
            .from("profiles")
            .select("is_premium, display_name")
            .eq("id", user.id)
            .maybeSingle(),
          touchCharacterSelection(supabase, user.id, characterId).catch(
            () => undefined
          ),
        ])
    );

    conversation = convResult;
    profileRow = profileResult.data;

    const history = await trace.span("Load Messages (SSR)", () =>
      fetchConversationMessages(supabase, user.id, conversation.id)
    );
    initialMessages = history.map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
      createdAt: m.createdAt,
      mediaType: m.mediaType,
      mediaUrl: m.mediaUrl,
      photoDeliveryId: m.photoDeliveryId,
    }));

    // 새 대화방이고 메시지가 없으면 캐릭터가 먼저 인사를 건넨다.
    // 이 경로는 첫 방문 사용자(이전 대화 없음)가 주로 해당하므로
    // LLM 없이 즉시 캐릭터 기본 인사를 반환한다.
    if (initialMessages.length === 0 && !conversation.lastMessageAt) {
      try {
        const { generateNewConversationGreeting } = await import(
          "@/services/newConversationGreeting"
        );
        const { message: greetMsg, emotion: greetEmotion } =
          await generateNewConversationGreeting(
            supabase,
            user.id,
            characterId,
            conversation.id
          );
        const now = new Date().toISOString();
        const { data: msgRow } = await supabase
          .from("messages")
          .insert({
            user_id: user.id,
            character_id: characterId,
            conversation_id: conversation.id,
            role: "assistant",
            content: greetMsg,
            emotion: greetEmotion,
          })
          .select("id, created_at")
          .single();
        if (msgRow) {
          initialMessages = [
            {
              id: msgRow.id,
              role: "assistant",
              content: greetMsg,
              createdAt: msgRow.created_at,
              mediaType: null,
              mediaUrl: null,
              photoDeliveryId: null,
            },
          ];
          // 대화방 목록에 인사 미리보기가 표시되도록 preview 갱신
          await updateConversationLastMessage(
            supabase,
            conversation.id,
            user.id,
            greetMsg,
            "assistant",
            now
          );
        }
      } catch {
        // 인사 생성 실패해도 빈 대화방으로 정상 진입
      }
    }
  } catch {
    try {
      conversation = await createConversation(supabase, user.id, characterId);
      const { data: profileFallback } = await supabase
        .from("profiles")
        .select("is_premium, display_name")
        .eq("id", user.id)
        .maybeSingle();
      profileRow = profileFallback;
    } catch {
      return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
          <p className="text-sm text-gray-600">
            대화방을 열지 못했습니다. 잠시 후 다시 시도해주세요.
          </p>
          <Link
            href="/characters"
            className="rounded-full bg-pink-accent px-6 py-2 text-sm text-white"
          >
            캐릭터 선택
          </Link>
        </main>
      );
    }
  }

  const isPremiumUser =
    (profileRow?.is_premium ?? false) ||
    isWhitelistedUnlimitedChat(user.id, user.email);
  trace.end(`${initialMessages.length} messages hydrated`);

  return (
    <ChatErrorBoundary>
      <ChatProvider
        character={toPublicCharacter(character)}
        characterId={characterId}
        conversationId={conversation.id}
        isPremiumUser={isPremiumUser}
        initialMessages={initialMessages}
        initialAffection={conversation.affection}
        initialRelationshipLevel={
          conversation.relationshipLevel as RelationshipLevel
        }
        initialEmotion={normalizeEmotion(conversation.emotion) as EmotionState}
        initialLastChatAt={conversation.lastMessageAt}
      >
        <ChatScreen
          conversationTitle={conversation.title ?? "새 대화"}
          userNickname={profileRow?.display_name ?? null}
          photoPushDeliveryId={photoPush ?? null}
        />
      </ChatProvider>
    </ChatErrorBoundary>
  );
}
