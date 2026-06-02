import { ChatScreen } from "@/components/chat/ChatScreen";
import { getCharacterById } from "@/data";
import { mapCharacterState } from "@/lib/db/mappers";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** 채팅 — 활성 캐릭터와 DeepSeek 스트리밍 대화 */
export default async function ChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: states } = await supabase
    .from("user_character_states")
    .select("*")
    .eq("user_id", user.id)
    .order("last_chat_at", { ascending: false, nullsFirst: false })
    .order("last_seen_at", { ascending: false })
    .limit(1);

  if (!states?.length) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <p className="text-sm text-gray-600">먼저 캐릭터를 선택해 주세요.</p>
        <Link
          href="/characters"
          className="rounded-full bg-pink-accent px-6 py-2 text-sm text-white"
        >
          캐릭터 선택하기
        </Link>
      </main>
    );
  }

  const state = mapCharacterState(states[0]);
  const character = getCharacterById(state.characterId);

  if (!character) {
    return (
      <main className="p-6 text-sm text-red-600">
        캐릭터 정보를 찾을 수 없습니다.
      </main>
    );
  }

  return <ChatScreen character={character} />;
}
