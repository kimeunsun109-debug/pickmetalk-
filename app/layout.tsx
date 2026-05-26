import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 여자친구 — 감성 연애 채팅",
  description: "한국형 감성 AI 여자친구 연애 채팅 서비스",
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
