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
        navy: "#112240",
        "navy-deep": "#0b1830",
        "navy-raise": "#1a2f54",
        teal: "#00c896",
        gold: "#f0b429",
        ink: "#0b1830",
        card: "#112240",
        mid: "#8892a4",
        "vgm-dark": "#2d3748",
        "bg-light": "#f4f6f9",
      },
      fontFamily: {
        ui: ["var(--font-ui)", "sans-serif"],
        display: ["var(--font-display)", "sans-serif"],
        head: ["var(--font-head)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        card: "0 4px 24px rgba(0, 0, 0, 0.18)",
      },
    },
  },
  plugins: [],
};
export default config;
