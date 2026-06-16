"use client";

import { characterChatPath } from "@/lib/chatRoute";
import type { Conversation } from "@/types";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";

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
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
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
  const [items, setItems] = useState(conversations);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressNextClickRef = useRef(false);

  const sorted = useMemo(
    () =>
      [...items].sort((a, b) => {
        const aTime = a.lastMessageAt ?? a.updatedAt;
        const bTime = b.lastMessageAt ?? b.updatedAt;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      }),
    [items]
  );

  async function deleteConversation(conversationId: string) {
    const res = await fetch(`/api/conversations/${conversationId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(data.error ?? "대화를 삭제하지 못했습니다.");
    }
  }

  async function handleDelete(conversation: Conversation) {
    if (!window.confirm(`"${conversation.title}" 대화를 삭제할까요?`)) return;

    setDeletingId(conversation.id);
    setError(null);

    try {
      await deleteConversation(conversation.id);
      setItems((prev) => prev.filter((item) => item.id !== conversation.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "대화를 삭제하지 못했습니다.");
    } finally {
      setDeletingId(null);
    }
  }

  function clearLongPressTimer() {
    if (!longPressTimerRef.current) return;
    clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
  }

  function startLongPressDelete(conversation: Conversation) {
    clearLongPressTimer();
    longPressTimerRef.current = setTimeout(() => {
      suppressNextClickRef.current = true;
      handleDelete(conversation);
    }, 650);
  }

  if (items.length === 0) {
    return (
      <div className="mt-12 text-center">
        <p className="text-sm text-gray-500">대화가 아직 없어요.</p>
        <Link
          href="/characters"
          className="mt-4 inline-block text-sm text-pink-accent underline"
        >
          캐릭터를 선택하고 대화를 시작해보세요.
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {error && (
        <p className="mb-2 rounded-xl bg-red-50 px-4 py-3 text-xs text-red-600">
          {error}
        </p>
      )}

      {filterCharacterId && (
        <Link
          href="/conversations"
          className="mb-2 text-xs text-gray-400 hover:text-pink-accent"
        >
          ← 전체 대화 보기
        </Link>
      )}

      <ul className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        {sorted.map((conv, index) => {
          const meta = characterMap[conv.characterId];
          const preview =
            conv.lastMessagePreview ??
            (conv.summary ? conv.summary.slice(0, 40) : "대화를 시작해보세요");

          return (
            <li
              key={conv.id}
              className={index > 0 ? "border-t border-gray-50" : undefined}
            >
              <div
                role="link"
                tabIndex={0}
                onClick={() => {
                  if (suppressNextClickRef.current) {
                    suppressNextClickRef.current = false;
                    return;
                  }
                  window.location.href = characterChatPath(
                    conv.characterId,
                    conv.id
                  );
                }}
                onContextMenu={(event) => {
                  event.preventDefault();
                  handleDelete(conv);
                }}
                onPointerDown={() => startLongPressDelete(conv)}
                onPointerUp={clearLongPressTimer}
                onPointerLeave={clearLongPressTimer}
                onPointerCancel={clearLongPressTimer}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    window.location.href = characterChatPath(
                      conv.characterId,
                      conv.id
                    );
                  }
                }}
                className={`flex cursor-pointer items-center gap-3 px-4 py-3.5 transition-colors active:bg-gray-50 ${
                  deletingId === conv.id ? "opacity-50" : ""
                }`}
              >
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-200 to-pink-400 text-base font-bold text-white">
                  {meta?.name?.[0] ?? conv.characterId[0]?.toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-[15px] font-semibold text-gray-900">
                      {meta?.name ?? conv.characterId}
                    </p>
                    <span className="shrink-0 text-[11px] text-gray-400">
                      {formatWhen(conv.lastMessageAt ?? conv.updatedAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[13px] text-gray-500">
                    {preview}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-center text-[10px] text-gray-400">
        대화를 길게 누르면 삭제할 수 있어요
      </p>
    </div>
  );
}
