import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: "#F7F1EC",
        paper: "#F7F1EC",
        night: "#100C0E",
        ink: "#1C1418",
        "rose-deep": "#B86A7A",
        "rose-muted": "#E0A8B4",
        "pink-soft": "#E8C4CC",
        "pink-accent": "#C97B8A",
        kakao: "#FEE500",
        "bubble-user": "#F0DCE2",
        "bubble-ai": "#FFFFFF",
      },
      fontFamily: {
        sans: ["var(--font-pretendard)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-pretendard)", "serif"],
      },
      animation: {
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "heart-float": "heart-float 1.5s ease-out forwards",
        "typing-dot": "typing-dot 1.4s infinite ease-in-out both",
        "fadeIn": "fade-in 0.25s ease-out both",
        "level-up-in": "level-up-in 0.45s cubic-bezier(0.34,1.56,0.64,1) both",
        "level-up-out": "level-up-out 0.3s ease-in both",
        "sparkle-pop": "sparkle-pop 0.6s ease-out both",
      },
      keyframes: {
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        "heart-float": {
          "0%": { transform: "translateY(0) scale(1)", opacity: "1" },
          "100%": { transform: "translateY(-60px) scale(1.2)", opacity: "0" },
        },
        "typing-dot": {
          "0%, 80%, 100%": { transform: "scale(0.6)", opacity: "0.4" },
          "40%": { transform: "scale(1)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(-4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "level-up-in": {
          "0%": { opacity: "0", transform: "translateY(100%) scale(0.92)" },
          "65%": { transform: "translateY(-5%) scale(1.03)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "level-up-out": {
          "0%": { opacity: "1", transform: "translateY(0) scale(1)" },
          "100%": { opacity: "0", transform: "translateY(-10px) scale(0.95)" },
        },
        "sparkle-pop": {
          "0%": { opacity: "0", transform: "scale(0) rotate(-20deg)" },
          "60%": { opacity: "1", transform: "scale(1.2) rotate(10deg)" },
          "100%": { opacity: "1", transform: "scale(1) rotate(0deg)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
