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
        ivory: "#FFF8F0",
        "pink-soft": "#FFD6E0",
        "pink-accent": "#FF8FAB",
        kakao: "#FEE500",
        "bubble-user": "#FFE4EC",
        "bubble-ai": "#FFFFFF",
      },
      fontFamily: {
        sans: ["var(--font-pretendard)", "system-ui", "sans-serif"],
      },
      animation: {
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "heart-float": "heart-float 1.5s ease-out forwards",
        "typing-dot": "typing-dot 1.4s infinite ease-in-out both",
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
      },
    },
  },
  plugins: [],
};

export default config;
