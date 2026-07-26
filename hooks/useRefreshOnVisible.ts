"use client";

import { useEffect } from "react";

/** Re-run callback when tab/app returns to foreground (cross-device handoff). */
export function useRefreshOnVisible(callback: () => void) {
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") callback();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [callback]);
}
