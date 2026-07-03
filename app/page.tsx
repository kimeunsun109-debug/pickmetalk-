import { Footer } from "@/components/layout/Footer";
import { HomeActions } from "@/components/home/HomeActions";
import { BRAND } from "@/lib/brand";
import { ServerPerfTrace } from "@/lib/perf/trace";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Landing entry that adapts to the current auth session. */
export default async function HomePage() {
  const trace = new ServerPerfTrace("Home Load");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  trace.mark("Auth getUser");
  trace.end(user ? "logged-in" : "guest");

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-bold text-pink-accent">{BRAND.name}</h1>
      <p className="text-center text-sm text-gray-600">{BRAND.tagline}</p>

      <HomeActions initialLoggedIn={Boolean(user)} />

      <Footer className="absolute bottom-0 w-full" />
    </main>
  );
}
