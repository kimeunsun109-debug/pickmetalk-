"use client";

import { characterChatPath } from "@/lib/chatRoute";
import type { Conversation } from "@/types";
import Link from "next/link";

interface CharacterMeta {
  name: string;
  avatar: string;
}

interface Props {
  conversations: Conversation[];
  characterMap: Record<string, CharacterMeta>;
  filterCharacterId: string | null;
}

function formatWhen(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) {
    return d.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (diffDays < 7) return `${diffDays}일 전`;
  return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

export function ConversationListClient({
  conversations,
  characterMap,
  filterCharacterId,
}: Props) {
  if (conversations.length === 0) {
    return (
      <div className="mt-12 text-center">
        <p className="text-sm text-gray-500">대화가 아직 없어요.</p>
        <Link
          href="/characters"
          className="mt-4 inline-block text-sm text-pink-accent underline"
        >
          캐릭터를 선택하고 대화를 시작해 보세요
        </Link>
      </div>
    );
  }

  const grouped = conversations.reduce<
    Record<string, Conversation[]>
  >((acc, conv) => {
    if (!acc[conv.characterId]) acc[conv.characterId] = [];
    acc[conv.characterId].push(conv);
    return acc;
  }, {});

  const characterIds = filterCharacterId
    ? [filterCharacterId]
    : Object.keys(grouped);

  return (
    <div className="mt-4 flex flex-col gap-6">
      {characterIds.map((charId) => {
        const meta = characterMap[charId];
        const items = grouped[charId] ?? [];
        if (items.length === 0) return null;

        return (
          <section key={charId}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-base font-semibold text-gray-900">
                {meta?.name ?? charId}
              </span>
              {filterCharacterId && (
                <Link
                  href="/conversations"
                  className="text-[10px] text-gray-400 hover:text-pink-accent"
                >
                  전체 보기
                </Link>
              )}
            </div>
            <ul className="flex flex-col gap-2">
              {items.map((conv) => (
                <li key={conv.id}>
                  <a
                    href={characterChatPath(conv.characterId, conv.id)}
                    className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm transition-colors hover:border-pink-soft hover:bg-pink-50/30"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {conv.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-gray-400">
                        호감도 {conv.affection}% · Lv{conv.relationshipLevel}
                      </p>
                    </div>
                    <span className="ml-3 shrink-0 text-[10px] text-gray-400">
                      {formatWhen(conv.lastMessageAt ?? conv.updatedAt)}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
