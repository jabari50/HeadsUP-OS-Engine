import type { Config } from "tailwindcss";

/* Ecosystem v4 editorial system — cream paper, white cards, hairline borders,
   Barlow Condensed display type, six-accent palette. The slate/red/green
   overrides retheme every existing utility in one place. */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#f1efe8",
        panel: "#ffffff",
        edge: "#d3d1c7",
        edge2: "#b4b2a9",
        ink: "#2c2c2a",
        // six-accent system (ecosystem v4)
        hgreen: "#1D9E75",
        hblue: "#378ADD",
        hpurple: "#7F77DD",
        hpink: "#D4537E",
        hamber: "#BA7517",
        horange: "#D85A30",
        // legacy utility aliases → new palette (retheme without touching pages)
        gold: "#BA7517",
        courtside: "#378ADD",
        slate: { 200: "#2c2c2a", 400: "#5f5e5a", 500: "#888780" },
        red: { 400: "#D85A30" },
        green: { 400: "#1D9E75" },
      },
      fontFamily: {
        display: ["var(--font-display)", "Impact", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
