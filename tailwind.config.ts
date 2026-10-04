import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm near-black base — pairs with gold (never a cold blue-black)
        charcoal: {
          950: "#0a0a0a",
          900: "#0f0e0c",
          800: "#161410",
          700: "#1f1c16",
          600: "#2a261d",
          500: "#38322a",
        },
        // Gold accent palette. NOTE: the token is still keyed `violet` so the
        // entire existing class surface (text-violet-soft, from-violet-glow,
        // ring-violet-glow, etc.) re-themes to gold with zero per-file churn.
        // The *values* are gold — the name is a legacy slot, not the colour.
        violet: {
          glow: "#d4af37", // primary metallic gold (buttons, glows, accents)
          soft: "#e8c766", // brighter gold for text/links on near-black
          deep: "#8a6d1f", // antique dark gold (gradient dark end)
          mist: "#f4e4b0", // pale champagne gold (gradient light end)
        },
        gold: "#d4af37",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.45)",
        glow: "0 0 60px -12px rgba(212, 175, 55, 0.45)",
        "glow-lg": "0 0 120px -20px rgba(212, 175, 55, 0.5)",
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
