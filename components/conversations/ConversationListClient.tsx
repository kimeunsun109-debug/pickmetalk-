"use client";

import { characterChatHref } from "@/lib/navigateChat";
import { useRefreshOnVisible } from "@/hooks/useRefreshOnVisible";
import type { Conversation } from "@/types";
import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";

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
  const [deletingAll, setDeletingAll] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
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

  const refreshList = useCallback(async () => {
    const qs = filterCharacterId ? `?characterId=${filterCharacterId}` : "";
    try {
      const res = await fetch(`/api/conversations${qs}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { conversations?: Conversation[] };
      if (Array.isArray(data.conversations)) setItems(data.conversations);
    } catch {
      /* keep current list */
    }
  }, [filterCharacterId]);

  useRefreshOnVisible(refreshList);

  async function deleteConversation(conversationId: string) {
    const res = await fetch(`/api/conversations/${conversationId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(data.error ?? "대화를 삭제하지 못했습니다.");
    }
  }

  async function handleDeleteAll() {
    setDeletingAll(true);
    setError(null);

    try {
      const res = await fetch("/api/conversations?all=true", {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "대화를 삭제하지 못했습니다.");
      }
      setItems([]);
      setShowDeleteAllConfirm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "대화를 삭제하지 못했습니다.");
    } finally {
      setDeletingAll(false);
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
              <Link
                href={characterChatHref(conv.characterId, conv.id)}
                onClick={(event) => {
                  if (suppressNextClickRef.current) {
                    event.preventDefault();
                    suppressNextClickRef.current = false;
                  }
                }}
                onContextMenu={(event) => {
                  event.preventDefault();
                  handleDelete(conv);
                }}
                onPointerDown={() => startLongPressDelete(conv)}
                onPointerUp={clearLongPressTimer}
                onPointerLeave={clearLongPressTimer}
                onPointerCancel={clearLongPressTimer}
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
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-center text-[10px] text-gray-400">
        대화를 길게 누르면 삭제할 수 있어요
      </p>

      <button
        type="button"
        disabled={deletingAll}
        onClick={() => setShowDeleteAllConfirm(true)}
        className="mt-4 w-full rounded-xl border border-red-200 py-3 text-sm text-red-500 disabled:opacity-50"
      >
        전체 대화 삭제
      </button>

      {showDeleteAllConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal
          aria-label="전체 대화 삭제 확인"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <p className="text-base font-semibold text-gray-900">
              대화를 모두 삭제할까요?
            </p>
            <p className="mt-2 text-sm text-gray-600">
              대화 내용을 삭제하면 다시 복구할 수 없습니다. 프로필·기본 설정은
              유지되며, 새 대화를 시작하게 됩니다.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-full border py-2.5 text-sm text-gray-600"
                onClick={() => setShowDeleteAllConfirm(false)}
              >
                취소
              </button>
              <button
                type="button"
                disabled={deletingAll}
                className="flex-1 rounded-full bg-red-500 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                onClick={() => void handleDeleteAll()}
              >
                {deletingAll ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
