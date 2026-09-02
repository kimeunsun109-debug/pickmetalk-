import { CharacterMeetClient } from "@/components/character/CharacterMeetClient";
import { characters } from "@/data";
import { activeCharacterQuery } from "@/lib/activeCharacter";
import { todaysPickIndex } from "@/lib/characters/images";
import { mapCharacterState } from "@/lib/db/mappers";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Character meet — swipe portraits on a light canvas. */
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

  const initialIndex = activeCharacterId
    ? Math.max(
        0,
        characters.findIndex((c) => c.id === activeCharacterId)
      )
    : todaysPickIndex(characters.length);

  return (
    <main className="min-h-[100dvh]">
      <CharacterMeetClient
        characters={characters}
        activeCharacterId={activeCharacterId}
        initialIndex={initialIndex < 0 ? 0 : initialIndex}
      />
    </main>
  );
}
