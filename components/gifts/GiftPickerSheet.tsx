"use client";

import { gifts } from "@/data";
import type { Gift } from "@/types";
import { memo, useCallback, useState } from "react";

interface GiftPickerSheetProps {
  open: boolean;
  characterName: string;
  sendingGiftId: string | null;
  onClose: () => void;
  onSelectGift: (gift: Gift) => void | Promise<void>;
}

export const GiftPickerSheet = memo(function GiftPickerSheet({
  open,
  characterName,
  sendingGiftId,
  onClose,
  onSelectGift,
}: GiftPickerSheetProps) {
  const [error, setError] = useState<string | null>(null);

  const handleSelect = useCallback(
    async (gift: Gift) => {
      if (sendingGiftId) return;
      setError(null);
      try {
        await onSelectGift(gift);
        onClose();
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "선물을 보내지 못했어요. 다시 시도해 주세요."
        );
      }
    },
    [onClose, onSelectGift, sendingGiftId]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="선물 선택 닫기"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-lg rounded-t-2xl bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-base font-semibold text-gray-900">선물하기</p>
            <p className="text-xs text-gray-500">{characterName}에게 무료 선물</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 active:bg-gray-100"
            aria-label="닫기"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="size-5"
            >
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {gifts.map((gift) => {
            const isSending = sendingGiftId === gift.id;
            return (
              <button
                key={gift.id}
                type="button"
                disabled={Boolean(sendingGiftId)}
                onClick={() => void handleSelect(gift)}
                className="flex flex-col items-center rounded-xl border border-gray-100 bg-gray-50 px-2 py-3 text-center transition-colors active:bg-pink-50 disabled:opacity-60"
              >
                <span className="text-2xl" aria-hidden>
                  {gift.emoji}
                </span>
                <span className="mt-1 text-sm font-medium text-gray-900">
                  {gift.name}
                </span>
                <span className="mt-0.5 text-[11px] text-pink-accent">
                  +{gift.affectionBonus}
                </span>
                {isSending && (
                  <span className="mt-1 text-[10px] text-gray-400">보내는 중…</span>
                )}
              </button>
            );
          })}
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </p>
        )}
      </div>
    </div>
  );
});
