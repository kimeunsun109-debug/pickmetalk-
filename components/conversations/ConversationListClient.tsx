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
  const [items, setItems] = useState(conversations);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressNextClickRef = useRef(false);

  const grouped = useMemo(
    () =>
      items.reduce<Record<string, Conversation[]>>((acc, conv) => {
        if (!acc[conv.characterId]) acc[conv.characterId] = [];
        acc[conv.characterId].push(conv);
        return acc;
      }, {}),
    [items]
  );

  const characterIds = filterCharacterId
    ? [filterCharacterId]
    : Object.keys(grouped);

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
    if (!window.confirm("이 대화를 삭제할까요?")) return;

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

  async function handleDeleteAll() {
    if (items.length === 0 || deletingAll) return;
    if (!window.confirm("현재 목록의 모든 대화를 삭제할까요?")) return;

    setDeletingAll(true);
    setError(null);

    const ids = items.map((item) => item.id);

    try {
      await Promise.all(ids.map((id) => deleteConversation(id)));
      setItems((prev) => prev.filter((item) => !ids.includes(item.id)));
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "전체 대화 삭제 중 오류가 발생했습니다."
      );
    } finally {
      setDeletingAll(false);
    }
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
    <div className="mt-4 flex flex-col gap-6">
      <div className="flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3 shadow-sm ring-1 ring-gray-100">
        <span className="text-xs text-gray-500">
          총 {items.length}개의 대화
        </span>
        <span className="text-[10px] text-gray-400">길게 눌러 삭제</span>
        <button
          type="button"
          onClick={handleDeleteAll}
          disabled={deletingAll}
          className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
        >
          {deletingAll ? "삭제 중..." : "전체 삭제"}
        </button>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-xs text-red-600 ring-1 ring-red-100">
          {error}
        </p>
      )}

      {characterIds.map((charId) => {
        const meta = characterMap[charId];
        const charItems = grouped[charId] ?? [];
        if (charItems.length === 0) return null;

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
              {charItems.map((conv) => (
                <li key={conv.id}>
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
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm transition-colors hover:border-pink-soft hover:bg-pink-50/30"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {conv.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-gray-400">
                        호감도 {conv.affection}% · Lv{conv.relationshipLevel}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] text-gray-400">
                      {formatWhen(conv.lastMessageAt ?? conv.updatedAt)}
                    </span>
                    <button
                      type="button"
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDelete(conv);
                      }}
                      disabled={deletingId === conv.id}
                      className="shrink-0 rounded-full border border-red-100 px-2 py-1 text-[10px] font-semibold text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
                      aria-label={`${conv.title} 삭제`}
                    >
                      {deletingId === conv.id ? "..." : "삭제"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
