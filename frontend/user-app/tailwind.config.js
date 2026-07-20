/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: "class",
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // ── Aligned with constants/brand.ts (source of truth)
        primary:       "#F03030",
        "primary-dark": "#C42020",
        "primary-light": "#FDEAEA",
        accent:        "#F5CE2E",
        "accent-dark": "#C9A800",
        "accent-light": "#FFFBEE",

        // ── Surface hierarchy
        bg:             "#FEFDF8",
        surface:        "#FFFFFF",
        "surface-low":  "#F5F4F0",
        "surface-high": "#FFFBEE",
        "input-bg":     "#FFFFFF",
        border:         "#E8E6DF",

        // ── Text
        text:    "#1C1C1E",
        "text-2": "#5C5C5E",
        "text-3": "#9CA3AF",

        // ── Semantic
        success: "#2DB87A",
        error:   "#DC2626",
        warn:    "#F5A623",
        info:    "#3A8FE8",
      },
      borderRadius: {
        card:  "16px",
        "card-sm": "12px",
        input: "12px",
        pill:  "9999px",
      },
      fontFamily: {
        display:  ["ReadexPro-Bold"],
        body:     ["ReadexPro-Regular"],
        medium:   ["ReadexPro-Medium"],
        semibold: ["ReadexPro-SemiBold"],
      },
    },
  },
  plugins: [],
};

