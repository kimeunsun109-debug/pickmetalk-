import Link from "next/link";

const tabs = [
  { href: "/characters", label: "캐릭터" },
  { href: "/chat/yuna", label: "채팅" },
  { href: "/gifts", label: "선물" },
  { href: "/settings", label: "설정" },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 flex w-full max-w-md -translate-x-1/2 border-t bg-white">
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className="flex-1 py-3 text-center text-xs text-gray-600"
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
