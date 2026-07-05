"use client";

import { trackEvent } from "@/services/analytics";
import { useCallback, useState } from "react";

interface Props {
  messageId: string;
  content: string;
  characterId: string;
  disabled?: boolean;
  onRegenerate?: () => void;
}

export function AssistantMessageActions({
  messageId,
  content,
  characterId,
  disabled,
  onRegenerate,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"like" | "dislike" | null>(null);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      trackEvent("message_copy", characterId);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }, [content, characterId]);

  const handleShare = useCallback(async () => {
    const text = content;
    try {
      if (navigator.share) {
        await navigator.share({ text, title: "PickmeTalk 대화" });
        trackEvent("message_share", characterId);
        return;
      }
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* user cancelled share */
    }
  }, [content, characterId]);

  const handleFeedback = useCallback(
    (type: "like" | "dislike") => {
      setFeedback(type);
      trackEvent(type === "like" ? "message_like" : "message_dislike", characterId);
      void fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: type === "like" ? "message_like" : "message_dislike",
          characterId,
          messageId,
        }),
      }).catch(() => undefined);
    },
    [characterId, messageId]
  );

  const btn =
    "inline-flex size-8 items-center justify-center rounded-full text-base transition hover:bg-black/5 disabled:opacity-40";

  return (
    <div className="mt-1 flex items-center gap-0.5 pl-11">
      <button
        type="button"
        className={btn}
        title="대화 복사"
        disabled={disabled}
        onClick={() => void handleCopy()}
        aria-label="대화 복사"
      >
        {copied ? "✅" : "📋"}
      </button>
      <button
        type="button"
        className={btn}
        title="스크린샷 공유"
        disabled={disabled}
        onClick={() => void handleShare()}
        aria-label="공유"
      >
        📸
      </button>
      <button
        type="button"
        className={btn}
        title="답변 재생성"
        disabled={disabled || !onRegenerate}
        onClick={onRegenerate}
        aria-label="답변 재생성"
      >
        🔄
      </button>
      <button
        type="button"
        className={`${btn} ${feedback === "like" ? "bg-pink-50" : ""}`}
        title="좋아요"
        disabled={disabled}
        onClick={() => handleFeedback("like")}
        aria-label="좋아요"
      >
        👍
      </button>
      <button
        type="button"
        className={`${btn} ${feedback === "dislike" ? "bg-gray-100" : ""}`}
        title="싫어요"
        disabled={disabled}
        onClick={() => handleFeedback("dislike")}
        aria-label="싫어요"
      >
        👎
      </button>
    </div>
  );
}
