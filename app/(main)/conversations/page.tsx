import { ConversationListClient } from "@/components/conversations/ConversationListClient";
import { characters } from "@/data";
import { mapConversation } from "@/lib/db/mappers";
import { truncatePreview } from "@/lib/formatMessageTime";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** 대화방 목록 — 캐릭터별 그룹 + 마지막 메시지 미리보기 */
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

  const conversationsWithPreview = conversations.map((conv) => {
    const characterName =
      characters.find((c) => c.id === conv.characterId)?.name ?? conv.characterId;
    const previewText = conv.lastMessagePreview;
    const prefix =
      conv.lastMessageRole === "user"
        ? "나: "
        : previewText
          ? `${characterName}: `
          : "";

    return {
      ...conv,
      lastMessagePreview: previewText
        ? `${prefix}${truncatePreview(previewText)}`
        : null,
    };
  });

  const characterMap = Object.fromEntries(
    characters.map((c) => [c.id, { name: c.name, avatar: c.avatar }])
  );

  return (
    <main className="min-h-screen bg-paper px-4 pb-24 pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] tracking-[0.18em] text-rose-muted">Inbox</p>
          <h1 className="mt-1 font-display text-3xl leading-none text-ink">채팅</h1>
        </div>
        <Link
          href="/characters"
          className="bg-rose-deep px-4 py-2 text-[12px] font-semibold tracking-wide text-paper"
        >
          새 대화
        </Link>
      </div>

      <ConversationListClient
        conversations={conversationsWithPreview}
        characterMap={characterMap}
        filterCharacterId={filterCharacterId ?? null}
      />
    </main>
  );
}
