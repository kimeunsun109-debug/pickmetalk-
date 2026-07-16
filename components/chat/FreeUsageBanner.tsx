"use client";

import { USAGE_BANNER_DURATION_MS } from "@/lib/constants";
import { t } from "@/lib/i18n";
import { useEffect } from "react";

export function FreeUsageBanner({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss?: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss?.(), USAGE_BANNER_DURATION_MS);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  return (
    <div
      role="status"
      className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex justify-center px-3 pt-2"
    >
      <div className="max-w-md rounded-full bg-gray-900/88 px-4 py-2 text-center text-xs font-medium text-white shadow-md backdrop-blur-sm">
        {message}
      </div>
    </div>
  );
}

export function usageBannerMessageForRemaining(remaining: number): string | null {
  if (remaining === 10) return t("usage.bannerTen");
  if (remaining === 5) return t("usage.bannerFive");
  return null;
}

export function shouldShowUsageBanner(remaining: number, usageDay: string): boolean {
  if (remaining !== 10 && remaining !== 5) return false;
  const key = `pickmetalk-usage-banner-${usageDay}-${remaining}`;
  if (typeof sessionStorage === "undefined") return true;
  if (sessionStorage.getItem(key)) return false;
  sessionStorage.setItem(key, "1");
  return true;
}
