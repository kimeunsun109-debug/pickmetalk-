import { HomeHero } from "@/components/home/HomeHero";
import { characters } from "@/data";
import { todaysPickIndex } from "@/lib/characters/images";
import { ServerPerfTrace } from "@/lib/perf/trace";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Landing entry — full-bleed character face + brand. */
export default async function HomePage() {
  const trace = new ServerPerfTrace("Home Load");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  trace.mark("Auth getUser");
  trace.end(user ? "logged-in" : "guest");

  const pick = characters[todaysPickIndex(characters.length)] ?? characters[0];

  return (
    <main className="min-h-[100dvh]">
      <HomeHero character={pick} loggedIn={Boolean(user)} />
    </main>
  );
}
