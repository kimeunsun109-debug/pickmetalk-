import { BRAND } from "@/lib/brand";
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: `${BRAND.name} — 감성 연애 채팅`,
  description: BRAND.description,
  metadataBase: new URL(BRAND.url),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: BRAND.name,
  },
  openGraph: {
    title: BRAND.name,
    description: BRAND.tagline,
    url: BRAND.url,
    siteName: BRAND.name,
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
