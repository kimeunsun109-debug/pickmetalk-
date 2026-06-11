import { ChatScreen } from "@/components/chat/ChatScreen";
import { ChatProvider } from "@/contexts/ChatProvider";
import { getCharacterById } from "@/data";
import {
  getConversationForCharacter,
  getConversationForUser,
  getOrCreateRecentConversation,
  touchCharacterSelection,
} from "@/lib/db/conversations";
import {
  characterChatPath,
  isCharacterId,
  isConversationUuid,
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

  if (!isCharacterId(id)) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <p className="text-sm text-gray-600">잘못된 채팅 주소입니다.</p>
        <Link
          href="/characters"
          className="rounded-full bg-pink-accent px-6 py-2 text-sm text-white"
        >
          캐릭터 선택
        </Link>
      </main>
    );
  }

  const characterId = id;
  const character = getCharacterById(characterId);
  if (!character) {
    return (
      <main className="p-6 text-sm text-red-600">
        캐릭터 정보를 찾을 수 없습니다.
      </main>
    );
  }

  await touchCharacterSelection(supabase, user.id, characterId);

  const conversation = queryConversationId
    ? (await getConversationForCharacter(
        supabase,
        user.id,
        characterId,
        queryConversationId
      )) ??
      (await getOrCreateRecentConversation(supabase, user.id, characterId))
    : await getOrCreateRecentConversation(supabase, user.id, characterId);

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
