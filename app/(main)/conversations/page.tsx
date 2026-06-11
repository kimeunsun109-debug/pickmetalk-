import { ConversationListClient } from "@/components/conversations/ConversationListClient";
import { characters } from "@/data";
import { mapConversation } from "@/lib/db/mappers";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** 대화방 목록 — 캐릭터별 그룹 */
export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: Promise<{ characterId?: string }>;
}) {
  const { characterId: filterCharacterId } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let query = supabase
    .from("conversations")
    .select("*")
    .eq("user_id", user.id)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false });

  if (filterCharacterId) {
    query = query.eq("character_id", filterCharacterId);
  }

  const { data: rows } = await query;
  const conversations = (rows ?? []).map((r) => mapConversation(r));

  const characterMap = Object.fromEntries(
    characters.map((c) => [c.id, { name: c.name, avatar: c.avatar }])
  );

  return (
    <main className="min-h-screen p-6 pb-24">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/characters"
            className="shrink-0 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="캐릭터 선택"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="size-5"
            >
              <path
                fillRule="evenodd"
                d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
          <h1 className="text-xl font-bold">대화 목록</h1>
        </div>
        <Link
          href="/characters"
          className="rounded-full bg-pink-accent px-4 py-1.5 text-xs font-semibold text-white"
        >
          + 새 대화
        </Link>
      </div>

      <ConversationListClient
        conversations={conversations}
        characterMap={characterMap}
        filterCharacterId={filterCharacterId ?? null}
      />
    </main>
  );
}
