// You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics. All outputs must directly support: what is broken, why, and what to fix first for an AI SaaS product.

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
        brand: {
          violet: "#7c3aed",
          cyan: "#22d3ee",
          amber: "#f59e0b",
          dark: "#0f0a1a",
          card: "#1a1625",
        },
      },
      fontFamily: {
        display: ["var(--font-syne)", "system-ui", "sans-serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-12px) rotate(1deg)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 20px rgba(124, 58, 237, 0.3)" },
          "100%": { boxShadow: "0 0 40px rgba(34, 211, 238, 0.4)" },
        },
      },
      transformStyle: {
        "3d": "preserve-3d",
      },
      perspective: {
        "1000": "1000px",
      },
      backfaceVisibility: {
        hidden: "hidden",
      },
    },
  },
  plugins: [],
};

export default config;
