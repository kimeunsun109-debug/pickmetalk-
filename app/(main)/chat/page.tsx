import { activeCharacterQuery } from "@/lib/activeCharacter";
import { characterChatPath } from "@/lib/chatRoute";
import { mapCharacterState } from "@/lib/db/mappers";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** /chat — 활성 캐릭터 채팅으로 이동 */
export default async function ChatIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: states } = await activeCharacterQuery(supabase, user.id);
  const activeCharacterId = states?.[0]
    ? mapCharacterState(states[0]).characterId
    : null;

  if (activeCharacterId) {
    redirect(characterChatPath(activeCharacterId));
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <p className="text-sm text-gray-600">아직 대화가 없어요.</p>
      <Link
        href="/characters"
        className="rounded-full bg-pink-accent px-6 py-2 text-sm text-white"
      >
        캐릭터 선택하기
      </Link>
      <Link href="/conversations" className="text-sm text-pink-accent underline">
        대화 목록
      </Link>
    </main>
  );
}
