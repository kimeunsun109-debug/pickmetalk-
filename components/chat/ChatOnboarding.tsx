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
          <p className="font-semibold text-pink-accent">PickmeTalk 사용법</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-gray-600">
            <li>캐릭터를 고르고 편하게 말을 걸어 보세요.</li>
            <li>일상·고민·취미 무엇이든 대화해요.</li>
            <li>글자를 드래그해 부분만 복사할 수 있어요.</li>
          </ul>
        </div>

        <div className="flex justify-start">
          <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-white px-4 py-2.5 text-sm text-gray-800 shadow-sm">
            안녕하세요, {name}님~ 😊
            <br />
            {character.name}와의 대화에 오신 걸 환영해요!
          </div>
        </div>

        <div className="flex justify-start">
          <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-white px-4 py-2.5 text-sm text-gray-800 shadow-sm">
            편하게 첫 인사를 건네 보세요.
            <br />
            &quot;안녕&quot;, &quot;오늘 힘들었어&quot;처럼 짧게 시작해도 괜찮아요 😄
          </div>
        </div>

        <button
          type="button"
          onClick={dismiss}
          className="w-full rounded-full border border-pink-accent py-2 text-xs font-medium text-pink-accent"
        >
          알겠어요, 대화 시작하기
        </button>
      </div>
    </div>
  );
}
