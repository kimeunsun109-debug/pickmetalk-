import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 여자친구 — 감성 연애 채팅",
  description: "한국형 감성 AI 여자친구 연애 채팅 서비스",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AI 여자친구",
  },
};

/** 모바일 최적화 viewport — 노치·다이나믹아일랜드 safe area 포함 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#FF8FAB",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <div className="app-shell">{children}</div>
      </body>
    </html>
  );
}
