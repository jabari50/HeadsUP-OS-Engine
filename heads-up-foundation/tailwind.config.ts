import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#112240",
        "navy-deep": "#0B1830",
        "navy-light": "#1E3A5F",
        teal: "#00c896",
        cream: "#F4F4F0",
        warmgray: "#8A8F99",
        gold: "#F5C518",
      },
      fontFamily: {
        headline: ["var(--font-bebas)", "Impact", "sans-serif"],
        body: ["var(--font-montserrat)", "sans-serif"],
        stat: ["var(--font-oswald)", "sans-serif"],
        quote: ["var(--font-dmserif)", "serif"],
      },
      letterSpacing: {
        headline: "0.08em",
        wide2: "0.12em",
      },
    },
  },
  plugins: [],
};
export default config;
