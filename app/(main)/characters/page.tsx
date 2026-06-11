import { CharacterSelectClient } from "@/components/character/CharacterSelectClient";
import { characters } from "@/data";
import { activeCharacterQuery } from "@/lib/activeCharacter";
import { mapCharacterState } from "@/lib/db/mappers";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * 캐릭터 선택 — data/characters.json 5명
 * 이미 선택한 캐릭터가 있으면 채팅 바로가기 표시
 */
export default async function CharactersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: states } = await activeCharacterQuery(supabase, user.id);

  const activeCharacterId = states?.[0]
    ? mapCharacterState(states[0]).characterId
    : null;

  return (
    <main className="min-h-screen p-6">
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/"
          className="shrink-0 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          aria-label="홈으로"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="size-5"
          >
            <path
              fillRule="evenodd"
              d="M9.293 2.293a1 1 0 0 1 1.414 0l7 7A1 1 0 0 1 17 11h-1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6H3a1 1 0 0 1-.707-1.707l7-7Z"
              clipRule="evenodd"
            />
          </svg>
        </Link>
        <span className="text-sm text-gray-400">홈</span>
      </div>

      <h1 className="text-xl font-bold">너의 그녀를 골라줘</h1>
      <p className="mt-2 text-sm text-gray-500">
        마음에 드는 캐릭터를 선택하면 채팅이 시작돼요
      </p>
      <div className="mt-6">
        <CharacterSelectClient
          characters={characters}
          activeCharacterId={activeCharacterId}
        />
      </div>
    </main>
  );
}
