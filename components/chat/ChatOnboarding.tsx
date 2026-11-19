"use client";

import type { PublicCharacter } from "@/types";
import { useEffect, useState } from "react";

const ONBOARDING_KEY = "pickmetalk:onboarding-seen";

interface Props {
  character: PublicCharacter;
  nickname?: string | null;
}

export function ChatOnboarding({ character, nickname }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(localStorage.getItem(ONBOARDING_KEY) !== "1");
    } catch {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(ONBOARDING_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  if (!visible) return null;

  const name = nickname?.trim() || "친구";

  return (
    <div className="px-4 py-6">
      <div className="mx-auto max-w-sm space-y-3">
        <div className="rounded-2xl bg-white px-4 py-3 text-sm text-gray-700 shadow-sm">
          <p className="font-semibold text-pink-accent">픽미톡에서 이렇게 시작해요</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-gray-600">
            <li>오늘 있었던 일이나 하고 싶은 이야기를 보내세요.</li>
            <li>짧은 한마디로 시작해도 충분해요.</li>
            <li>마음에 남는 답변은 길게 눌러 복사할 수 있어요.</li>
          </ul>
        </div>

        <div className="flex justify-start">
          <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-white px-4 py-2.5 text-sm text-gray-800 shadow-sm">
            안녕하세요, {name}님!
            <br />
            오늘은 {character.name}와 편하게 이야기 나눠 봐요.
          </div>
        </div>

        <div className="flex justify-start">
          <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-white px-4 py-2.5 text-sm text-gray-800 shadow-sm">
            부담 없이 이렇게 시작해 보세요.
            <br />
            &quot;안녕! 오늘 하루 어땠어?&quot; 또는 &quot;오늘 조금 힘들었어&quot;
          </div>
        </div>

        <button
          type="button"
          onClick={dismiss}
          className="w-full rounded-full border border-pink-accent py-2 text-xs font-medium text-pink-accent"
        >
          대화 시작하기
        </button>
      </div>
    </div>
  );
}
