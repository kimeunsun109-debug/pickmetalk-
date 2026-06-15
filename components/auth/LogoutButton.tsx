"use client";

import { logout } from "@/lib/auth/logout";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

type Variant = "header" | "settings";

const styles: Record<Variant, string> = {
  header:
    "shrink-0 rounded-full border border-gray-200 px-2.5 py-1 text-[10px] font-semibold text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50",
  settings:
    "w-full rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition-colors active:bg-gray-100 disabled:opacity-50",
};

export function LogoutButton({ variant = "header" }: { variant?: Variant }) {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    if (loading) return;
    setLoading(true);
    try {
      const supabase = createClient();
      await logout(supabase);
    } catch {
      window.location.href = "/login";
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={styles[variant]}
    >
      {loading ? "로그아웃 중..." : "로그아웃"}
    </button>
  );
}
