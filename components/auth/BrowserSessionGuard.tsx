"use client";

import {
  hasActiveBrowserSession,
  markBrowserSessionActive,
  registerBrowserTab,
} from "@/lib/auth/browserSession";
import { clearClientSessionData } from "@/lib/auth/clearClientSession";
import { createClient } from "@/lib/supabase/client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const PROTECTED_PREFIXES = [
  "/chat",
  "/characters",
  "/conversations",
  "/settings",
  "/gifts",
] as const;

function hasSupabaseAuthCookie(): boolean {
  return document.cookie.split(";").some((part) => {
    const name = part.trim().split("=")[0];
    return name.startsWith("sb-");
  });
}

export function BrowserSessionGuard() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => registerBrowserTab(), []);

  useEffect(() => {
    const isProtected = PROTECTED_PREFIXES.some((prefix) =>
      pathname.startsWith(prefix)
    );
    if (!isProtected) return;

    const currentParams = new URLSearchParams(window.location.search);
    if (currentParams.get("session_start") === "1") {
      markBrowserSessionActive();
      currentParams.delete("session_start");
      const query = currentParams.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
      return;
    }

    if (!hasSupabaseAuthCookie()) {
      clearClientSessionData();
      return;
    }

    if (hasActiveBrowserSession()) return;

    clearClientSessionData();
    try {
      const supabase = createClient();
      supabase.auth.signOut().finally(() => {
        router.replace("/login");
        router.refresh();
      });
    } catch {
      router.replace("/login");
      router.refresh();
    }
  }, [pathname, router]);

  return null;
}
