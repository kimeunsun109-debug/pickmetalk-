"use client";

import { trackEvent } from "@/services/analytics";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

export function PhotoMessageBubble({
  mediaUrl,
  caption,
  photoDeliveryId,
  characterId,
}: {
  mediaUrl: string;
  caption: string;
  photoDeliveryId?: string | null;
  characterId?: string;
}) {
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    if (!photoDeliveryId) return;
    trackEvent("photo_push_viewed", characterId, { deliveryId: photoDeliveryId });
    void fetch(`/api/photo-push/${photoDeliveryId}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "view" }),
    }).catch(() => undefined);
  }, [photoDeliveryId, characterId]);

  const openViewer = useCallback(() => {
    setViewerOpen(true);
    trackEvent("photo_viewer_open", characterId, {
      deliveryId: photoDeliveryId ?? undefined,
    });
  }, [characterId, photoDeliveryId]);

  useEffect(() => {
    if (!viewerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewerOpen]);

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={openViewer}
          className="relative max-w-[220px] overflow-hidden rounded-2xl rounded-tl-sm bg-gray-100 text-left shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-300"
          aria-label="사진 크게 보기"
        >
          <Image
            src={mediaUrl}
            alt="캐릭터가 보낸 사진"
            width={220}
            height={280}
            className="h-auto w-full object-cover"
            unoptimized
            onError={(e) => {
              const img = e.currentTarget;
              img.style.display = "none";
            }}
          />
        </button>
        {caption.trim() ? (
          <p className="whitespace-pre-wrap break-words text-[15px] leading-[1.45] text-gray-800">
            {caption}
          </p>
        ) : null}
      </div>

      {viewerOpen ? (
        <div
          className="fixed inset-0 z-[80] flex flex-col bg-black/92"
          role="dialog"
          aria-modal="true"
          aria-label="사진 보기"
        >
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <span className="text-sm opacity-80">사진</span>
            <button
              type="button"
              className="rounded-full px-3 py-1 text-sm hover:bg-white/10"
              onClick={() => setViewerOpen(false)}
            >
              닫기
            </button>
          </div>
          <div className="flex flex-1 items-center justify-center overflow-auto p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mediaUrl}
              alt={caption || "캐릭터 사진"}
              className="max-h-[85vh] max-w-full object-contain"
            />
          </div>
          {caption.trim() ? (
            <p className="px-5 pb-8 text-center text-sm text-white/90">
              {caption}
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
