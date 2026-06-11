import type { CapacitorConfig } from "@capacitor/cli";

/**
 * capacitor.config.ts
 *
 * ──────────────────────────────────────────────────────────────
 * 이 프로젝트는 서버 API 라우트(/api/chat 등)가 있어
 * 정적 빌드(output: 'export')를 사용할 수 없습니다.
 *
 * 해결책: server.url 을 배포 URL(Vercel 등)로 지정하면
 *   Capacitor WebView 가 webDir 대신 해당 URL을 불러옵니다.
 *   → 네이티브 셸(APK) + 서버 렌더링 공존 가능
 *
 * ─── 환경별 전환 방법 ───────────────────────────────────────
 *   개발 중:   server.url = "https://pickmetalk.com"  (Android 에뮬레이터 → localhost)
 *   실제 기기: server.url = "https://pickmetalk.com"
 *   프로덕션:  server.url = "https://pickmetalk.com"
 * ──────────────────────────────────────────────────────────────
 */

const config: CapacitorConfig = {
  /** 앱 고유 ID — 구글 플레이 스토어 등록 시 변경 불가 */
  appId: "com.pickmetalk.app",

  /** 앱 표시 이름 */
  appName: "픽미톡",

  /**
   * webDir — server.url 이 설정되면 이 폴더는 무시됩니다.
   * server.url 을 제거했을 때(완전 정적 빌드)의 폴백 경로입니다.
   */
  webDir: "out",

  /**
   * server.url 이 있으면 WebView는 이 URL을 엽니다.
   * ── 개발 환경 ──
   *   Android 에뮬레이터에서 로컬 개발 서버를 접근할 때:
   *   10.0.2.2 는 Android 에뮬레이터의 localhost alias
   *
   * ── 프로덕션 배포 ──
   *   프로덕션: "https://pickmetalk.com"
   */
  server: {
    url: "http://10.0.2.2:3000",
    cleartext: true, // HTTP 허용 (개발용). HTTPS 배포 후 제거 가능
    androidScheme: "https",
  },

  android: {
    /** 상단 웹뷰 배경색 (로딩 중 흰 화면 방지) */
    backgroundColor: "#fff8f0",
    /** Android 12+ Edge-to-edge */
    allowMixedContent: false,
  },

  plugins: {
    /** 상태바 색상 (핑크 테마 유지) */
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#FF8FAB",
    },
    /** 스플래시 화면 */
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#fff8f0",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
    },
  },
};

export default config;
