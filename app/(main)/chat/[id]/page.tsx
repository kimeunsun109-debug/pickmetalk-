import { ChatScreen } from "@/components/chat/ChatScreen";
import { ChatProvider } from "@/contexts/ChatProvider";
import { getCharacterById } from "@/data";
import {
  createConversation,
  getConversationForCharacter,
  getConversationForUser,
  getOrCreateRecentConversation,
  touchCharacterSelection,
} from "@/lib/db/conversations";
import {
  characterChatPath,
  isCharacterId,
  isConversationUuid,
  resolveCharacterId,
} from "@/lib/chatRoute";
import { createClient } from "@/lib/supabase/server";
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
  searchParams: Promise<{ conversationId?: string }>;
}) {
  const { id } = await params;
  const { conversationId: queryConversationId } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  try {
    await touchCharacterSelection(supabase, user.id, characterId);
  } catch {
    /* 선택 기록 실패해도 채팅은 진행 */
  }

  let conversation;

  try {
    if (queryConversationId) {
      const matched = await getConversationForCharacter(
        supabase,
        user.id,
        characterId,
        queryConversationId
      );
      if (matched) {
        conversation = matched;
      } else {
        conversation = await getOrCreateRecentConversation(
          supabase,
          user.id,
          characterId
        );
      }
    } else {
      conversation = await getOrCreateRecentConversation(
        supabase,
        user.id,
        characterId
      );
    }
  } catch {
    try {
      conversation = await createConversation(supabase, user.id, characterId);
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

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("is_premium")
    .eq("id", user.id)
    .maybeSingle();

  const isPremiumUser = profileRow?.is_premium ?? false;

  return (
    <ChatProvider
      key={`${characterId}-${conversation.id}`}
      character={character}
      characterId={characterId}
      conversationId={conversation.id}
      isPremiumUser={isPremiumUser}
    >
      <ChatScreen conversationTitle={conversation.title} />
    </ChatProvider>
  );
}
