"use client";

import { PREMIUM_VALUE_PROPOSITION } from "@/lib/stripe/plans";
import { useChat } from "@/contexts/ChatProvider";
import { useCallback, useEffect, useState } from "react";

/**
 * PremiumModal — 베타 핵심: "무제한 대화" 하나로 결제 이유를 명확히.
 */
export function PremiumModal() {
  const {
    showPremiumModal,
    premiumModalReason,
    closePremiumModal,
    character,
    isPremiumUser,
  } = useChat();
  const [loadingPlan, setLoadingPlan] = useState<"monthly" | "yearly" | null>(
    null
  );
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const limitReached = premiumModalReason === "daily_limit";

  useEffect(() => {
    if (!showPremiumModal) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePremiumModal();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showPremiumModal, closePremiumModal]);

  useEffect(() => {
    if (showPremiumModal) {
      document.body.style.overflow = "hidden";
      setCheckoutError(null);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showPremiumModal]);

  const startCheckout = useCallback(async (plan: "monthly" | "yearly") => {
    setLoadingPlan(plan);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "결제 페이지를 열지 못했어요.");
      }
      window.location.href = data.url;
    } catch (e) {
      setCheckoutError(
        e instanceof Error ? e.message : "결제를 시작하지 못했어요."
      );
    } finally {
      setLoadingPlan(null);
    }
  }, []);

  if (!showPremiumModal || isPremiumUser) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
      onClick={closePremiumModal}
      role="dialog"
      aria-modal="true"
      aria-label="Premium 구독 안내"
    >
      <div
        className="w-full max-w-sm rounded-t-3xl bg-white px-6 pb-10 pt-6 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-gray-200 sm:hidden" />

        <div className="flex justify-center text-5xl mb-3" aria-hidden>
          {limitReached ? "💬" : "⭐"}
        </div>

        <h2 className="text-center text-lg font-bold text-gray-900">
          {limitReached
            ? PREMIUM_VALUE_PROPOSITION.headline
            : `${character.name}와 더 깊은 대화`}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500 leading-relaxed">
          <span className="font-semibold text-pink-accent">
            ⭐ Premium
          </span>{" "}
          가입 시
          <br />
          <span className="text-base font-bold text-gray-800">
            {PREMIUM_VALUE_PROPOSITION.primaryBenefit}
          </span>
        </p>

        <ul className="mt-5 space-y-2 rounded-2xl bg-ivory p-4 text-sm text-gray-700">
          <li className="font-semibold text-pink-accent">
            ♾️ Monthly · Yearly — 무제한 대화
          </li>
          {PREMIUM_VALUE_PROPOSITION.futureBenefits.map((item) => (
            <li key={item} className="flex items-center gap-2 text-gray-500">
              <span className="text-xs text-gray-400">준비 중</span>
              {item}
            </li>
          ))}
        </ul>

        {checkoutError && (
          <p className="mt-3 text-center text-xs text-red-500">{checkoutError}</p>
        )}

        <button
          type="button"
          disabled={loadingPlan !== null}
          onClick={() => startCheckout("monthly")}
          className="mt-5 w-full rounded-2xl bg-pink-accent py-3.5 text-sm font-bold text-white shadow-md active:scale-95 transition-transform disabled:opacity-60"
        >
          {loadingPlan === "monthly"
            ? "이동 중…"
            : "월간 구독 — ₩9,900"}
        </button>

        <button
          type="button"
          disabled={loadingPlan !== null}
          onClick={() => startCheckout("yearly")}
          className="mt-2 w-full rounded-2xl border border-pink-accent py-3 text-sm font-semibold text-pink-accent active:scale-95 transition-transform disabled:opacity-60"
        >
          {loadingPlan === "yearly"
            ? "이동 중…"
            : "연간 구독 — ₩79,000 (약 33% 할인)"}
        </button>

        <button
          type="button"
          onClick={closePremiumModal}
          className="mt-3 w-full py-2 text-sm text-gray-400 hover:text-gray-600"
        >
          내일 다시 할게요
        </button>
      </div>
    </div>
  );
}
