import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        court: {
          bg: "#0A0E1A",
          card: "#111827",
          alt: "#1A2236",
          line: "#1F2A44",
        },
        accent: {
          DEFAULT: "#FF7A00",
          hot: "#FF9A3C",
        },
      },
      fontFamily: {
        display: ["Oswald", "system-ui", "sans-serif"],
        condensed: ["Barlow Condensed", "system-ui", "sans-serif"],
        body: ["Barlow", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 40px rgba(255,122,0,0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
