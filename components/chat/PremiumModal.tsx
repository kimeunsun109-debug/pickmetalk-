"use client";

import { useChat } from "@/contexts/ChatProvider";
import { t } from "@/lib/i18n";
import { useCallback, useEffect, useState } from "react";

export function PremiumModal() {
  const {
    showPremiumModal,
    premiumModalReason,
    closePremiumModal,
    isPremiumUser,
  } = useChat();
  const [loading, setLoading] = useState(false);
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

  const startCheckout = useCallback(async () => {
    setLoading(true);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/premium/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: "monthly", locale: "ko" }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        url?: string;
        message?: string;
      };
      if (data.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setCheckoutError(
        data.message ?? t("premium.paymentPreparing")
      );
    } catch {
      setCheckoutError(t("premium.paymentUnavailable"));
    } finally {
      setLoading(false);
    }
  }, []);

  if (!showPremiumModal || isPremiumUser) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
      onClick={closePremiumModal}
      role="dialog"
      aria-modal="true"
      aria-label="Premium 안내"
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
            ? t("premium.headlineLimit")
            : t("premium.headlineDefault")}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500 leading-relaxed">
          {t("premium.subtitle")}
          <br />
          <span className="text-base font-bold text-gray-800">
            {t("premium.primaryBenefit")}
          </span>
        </p>

        <ul className="mt-5 space-y-2 rounded-2xl bg-ivory p-4 text-sm text-gray-700">
          <li className="font-semibold text-pink-accent">
            {t("premium.benefitUnlimited")}
          </li>
          <li className="text-gray-500">{t("premium.benefitFuture")}</li>
        </ul>

        {checkoutError && (
          <p className="mt-3 text-center text-xs text-gray-600">{checkoutError}</p>
        )}

        <button
          type="button"
          disabled={loading}
          onClick={() => void startCheckout()}
          className="mt-5 w-full rounded-2xl bg-pink-accent py-3.5 text-sm font-bold text-white shadow-md active:scale-95 transition-transform disabled:opacity-60"
        >
          {loading ? "…" : t("premium.cta")}
        </button>

        <button
          type="button"
          onClick={closePremiumModal}
          className="mt-3 w-full py-2 text-sm text-gray-400 hover:text-gray-600"
        >
          {t("common.later")}
        </button>
      </div>
    </div>
  );
}
