"use client";

import { useChat } from "@/contexts/ChatProvider";
import { useEffect } from "react";

/**
 * PremiumModal — 프리미엄 콘텐츠 잠금 해제 모달
 *
 * ChatProvider 안에서 렌더링해야 한다.
 * showPremiumModal 이 true 일 때 fixed overlay로 표시된다.
 */
export function PremiumModal() {
  const { showPremiumModal, closePremiumModal, character } = useChat();

  // ESC 키로 닫기
  useEffect(() => {
    if (!showPremiumModal) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePremiumModal();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showPremiumModal, closePremiumModal]);

  // 스크롤 잠금
  useEffect(() => {
    if (showPremiumModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showPremiumModal]);

  if (!showPremiumModal) return null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
      onClick={closePremiumModal}
      role="dialog"
      aria-modal="true"
      aria-label="프리미엄 구독 안내"
    >
      {/* Sheet — 클릭 전파 막기 */}
      <div
        className="w-full max-w-sm rounded-t-3xl bg-white px-6 pb-10 pt-6 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 핸들 */}
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-gray-200 sm:hidden" />

        {/* 아이콘 */}
        <div className="flex justify-center text-5xl mb-4" aria-hidden>
          🔒
        </div>

        {/* 헤드라인 */}
        <h2 className="text-center text-lg font-bold text-gray-900">
          {character.name}의 숨겨진 속마음
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500 leading-relaxed">
          프리미엄 멤버만 볼 수 있는 진심이 담겨있어요.
          <br />
          지금 구독하면{" "}
          <span className="font-semibold text-pink-accent">모든 캐릭터</span>의
          숨겨진 대사를 확인할 수 있어요.
        </p>

        {/* 혜택 리스트 */}
        <ul className="mt-5 space-y-2.5 rounded-2xl bg-ivory p-4 text-sm text-gray-700">
          {[
            "💬 캐릭터 속마음 실시간 공개",
            "♾️ 하루 메시지 무제한",
            "🎁 전용 선물·이벤트 우선 오픈",
            "✨ 프리미엄 전용 스토리 해금",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span>{item}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button
          onClick={() => {
            // TODO: 실제 결제 플로우 연결 (e.g. Toss Payments, Stripe)
            closePremiumModal();
            alert("결제 페이지로 이동합니다. (준비 중)");
          }}
          className="mt-5 w-full rounded-2xl bg-pink-accent py-3.5 text-sm font-bold text-white shadow-md active:scale-95 transition-transform"
        >
          프리미엄 구독하기 — ₩9,900 / 월
        </button>

        {/* 취소 */}
        <button
          onClick={closePremiumModal}
          className="mt-3 w-full py-2 text-sm text-gray-400 hover:text-gray-600"
        >
          다음에 할게요
        </button>
      </div>
    </div>
  );
}
