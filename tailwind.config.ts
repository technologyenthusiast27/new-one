import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Pure-black monochrome base (#000 page background, neutral grey ramp).
        charcoal: {
          950: "#000000",
          900: "#080808",
          800: "#101010",
          700: "#1a1a1a",
          600: "#262626",
          500: "#333333",
        },
        // Monochrome accent palette (white/silver). NOTE: the token is still
        // keyed `violet` so the entire existing class surface (text-violet-soft,
        // from-violet-glow, ring-violet-glow, etc.) re-themes with zero per-file
        // churn. The *values* are white/grey — the name is a legacy slot.
        violet: {
          glow: "#ffffff", // primary white (buttons, glows, accents)
          soft: "#e5e5e5", // light silver for text/links/eyebrows on black
          deep: "#a3a3a3", // mid grey (gradient dark end)
          mist: "#ffffff", // white (gradient light end)
        },
        gold: "#e5e5e5",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.5)",
        glow: "0 0 55px -14px rgba(255, 255, 255, 0.25)",
        "glow-lg": "0 0 110px -22px rgba(255, 255, 255, 0.3)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-14px)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "0.9" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "gradient-pan": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        float: "float 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 5s ease-in-out infinite",
        shimmer: "shimmer 2s infinite",
        "gradient-pan": "gradient-pan 8s ease infinite",
      },
    },
  },
  plugins: [],
};

export default config;
