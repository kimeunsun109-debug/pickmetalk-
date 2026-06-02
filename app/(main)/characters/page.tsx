import { CharacterSelectClient } from "@/components/character/CharacterSelectClient";
import { characters } from "@/data";
import { mapCharacterState } from "@/lib/db/mappers";
import { createClient } from "@/lib/supabase/server";
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

  const { data: states } = await supabase
    .from("user_character_states")
    .select("*")
    .eq("user_id", user.id)
    .order("last_chat_at", { ascending: false, nullsFirst: false })
    .order("last_seen_at", { ascending: false })
    .limit(1);

  const activeCharacterId = states?.[0]
    ? mapCharacterState(states[0]).characterId
    : null;

  return (
    <main className="min-h-screen p-6">
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
