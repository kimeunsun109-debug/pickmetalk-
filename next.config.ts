import withPWA from "@ducanh2912/next-pwa";
import type { NextConfig } from "next";

const enablePWA = process.env.ENABLE_PWA === "true";

const baseConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
};

export default withPWA({
  dest: "public",
  disable: !enablePWA,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
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
