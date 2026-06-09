import withPWA from "@ducanh2912/next-pwa";
import type { NextConfig } from "next";

/**
 * ─────────────────────────────────────────────
 * next.config.ts
 *
 * PWA(next-pwa) + Capacitor 공존 설정
 *
 * ⚠️ output: 'export' 주의
 *   이 프로젝트는 /api/* 서버 라우트가 있어
 *   정적 내보내기를 사용하면 API가 전부 비활성화됩니다.
 *   → PWA는 Vercel(서버 렌더링) 배포로 운영
 *   → Android APK는 Capacitor가 배포 URL을 WebView로 감싸는 방식
 *
 * ─────────────────────────────────────────────
 */
const baseConfig: NextConfig = {
  /* 이미지 최적화 — Capacitor WebView 호환 */
  images: {
    unoptimized: true,
  },
};

export default withPWA({
  /**
   * Service Worker 출력 위치 (public 폴더)
   * 빌드 후 public/sw.js, public/workbox-*.js 자동 생성됨
   */
  dest: "public",

  /** 개발 모드에서는 SW 비활성화 (HMR 충돌 방지) */
  disable: process.env.NODE_ENV === "development",

  /** 프론트엔드 페이지 이동 시 캐시 우선 탐색 */
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,

  /** 오프라인 → 온라인 복구 시 자동 새로고침 */
  reloadOnOnline: true,

  /** Workbox 상세 옵션 */
  workboxOptions: {
    disableDevLogs: true,
    /** 런타임 캐싱: API 응답은 캐시하지 않음 (채팅 특성상 항상 최신 데이터 필요) */
    runtimeCaching: [
      {
        // 정적 에셋 (이미지, 폰트 등)
        urlPattern: /^https:\/\/.*\.(png|jpg|jpeg|svg|gif|webp|woff2?)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "static-assets",
          expiration: { maxEntries: 64, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
    ],
  },
})(baseConfig);
