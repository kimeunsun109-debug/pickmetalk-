"use client";

import { gifts } from "@/data";
import { deviceSessionHeaders } from "@/lib/auth/deviceSession";
import type { Gift } from "@/types";
import type { GiftSendResponse } from "@/types/api";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

export default function GiftsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const characterId = searchParams.get("characterId");
  const conversationId = searchParams.get("conversationId");
  const canSend = Boolean(characterId && conversationId);

  const [sendingGiftId, setSendingGiftId] = useState<string | null>(null);
  const [result, setResult] = useState<GiftSendResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const backHref = useMemo(() => {
    if (characterId && conversationId) {
      return `/chat/${characterId}?conversationId=${conversationId}`;
    }
    return "/conversations";
  }, [characterId, conversationId]);

  const handleSend = useCallback(
    async (gift: Gift) => {
      if (!characterId || !conversationId) {
        throw new Error("대화방 정보가 없습니다. 채팅에서 선물하기를 이용해 주세요.");
      }

      setSendingGiftId(gift.id);
      setError(null);

      try {
        const res = await fetch("/api/gifts/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...deviceSessionHeaders(),
          },
          body: JSON.stringify({
            characterId,
            giftId: gift.id,
            conversationId,
          }),
        });

        const data = (await res.json()) as GiftSendResponse & { error?: string };
        if (!res.ok) {
          throw new Error(data.error ?? "선물 전송에 실패했습니다.");
        }

        setResult(data);
      } finally {
        setSendingGiftId(null);
      }
    },
    [characterId, conversationId]
  );

  return (
    <main className="mx-auto min-h-[100dvh] max-w-lg bg-paper p-6">
      <div className="mb-4 flex items-center justify-between">
        <Link href={backHref} className="text-sm text-gray-500">
          ← 돌아가기
        </Link>
      </div>

      <h1 className="text-xl font-bold text-gray-900">선물하기</h1>
      <p className="mt-2 text-sm text-gray-500">
        무료 선물을 고르면 호감도가 올라가고 캐릭터 반응이 채팅에 남아요.
      </p>

      {!canSend && (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          채팅 화면에서 선물 버튼을 누르거나, 대화 중인 채팅 URL로 접속해 주세요.
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3">
        {gifts.map((gift) => (
          <button
            key={gift.id}
            type="button"
            disabled={!canSend || Boolean(sendingGiftId)}
            onClick={() => void handleSend(gift).catch((e: unknown) => {
              setError(
                e instanceof Error ? e.message : "선물 전송에 실패했습니다."
              );
            })}
            className="rounded-2xl border border-gray-100 bg-white px-4 py-5 text-left shadow-sm transition-colors active:bg-pink-50 disabled:opacity-50"
          >
            <span className="text-3xl">{gift.emoji}</span>
            <p className="mt-2 font-semibold text-gray-900">{gift.name}</p>
            <p className="mt-1 text-xs text-gray-500">{gift.description}</p>
            <p className="mt-2 text-xs font-medium text-pink-accent">
              호감도 +{gift.affectionBonus}
            </p>
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-4 rounded-xl border border-pink-100 bg-pink-50 px-4 py-3 text-sm text-gray-800">
          <p className="font-medium">
            {result.gift.emoji} {result.gift.name} 전송 완료
          </p>
          <p className="mt-1 text-gray-600">{result.reaction.message}</p>
          <p className="mt-2 text-xs text-pink-accent">
            호감도 {result.affection}% · Lv{result.relationshipLevel}
          </p>
          {characterId && conversationId && (
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/chat/${characterId}?conversationId=${conversationId}`
                )
              }
              className="mt-3 rounded-full bg-pink-accent px-4 py-2 text-xs font-medium text-white"
            >
              채팅으로 돌아가기
            </button>
          )}
        </div>
      )}
    </main>
  );
}
