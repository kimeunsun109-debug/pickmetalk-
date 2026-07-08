"use client";

import { trackEvent } from "@/services/analytics";
import Image from "next/image";
import { useEffect } from "react";

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
  useEffect(() => {
    if (!photoDeliveryId) return;
    trackEvent("photo_push_viewed", characterId, { deliveryId: photoDeliveryId });
    void fetch(`/api/photo-push/${photoDeliveryId}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "view" }),
    }).catch(() => undefined);
  }, [photoDeliveryId, characterId]);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative max-w-[220px] overflow-hidden rounded-2xl rounded-tl-sm bg-gray-100 shadow-sm">
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
      </div>
      {caption.trim() ? (
        <p className="whitespace-pre-wrap break-words text-[15px] leading-[1.45] text-gray-800">
          {caption}
        </p>
      ) : null}
    </div>
  );
}
