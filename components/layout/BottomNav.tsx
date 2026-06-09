"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/characters", label: "캐릭터", icon: "👤" },
  { href: "/chat",       label: "채팅",   icon: "💬" },
  { href: "/settings",  label: "설정",   icon: "⚙️" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 flex w-full max-w-md -translate-x-1/2 border-t border-gray-100 bg-white pb-safe">
      {tabs.map((t) => {
        const isActive = pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] transition-colors ${
              isActive ? "text-pink-accent" : "text-gray-400"
            }`}
          >
            <span className="text-lg leading-none" aria-hidden>
              {t.icon}
            </span>
            <span>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
