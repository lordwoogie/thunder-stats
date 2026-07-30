import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0A0E1A",
          card: "#111827",
          alt: "#1A2236"
        },
        brand: {
          blue: "#007AC1",
          dark: "#002D62",
          orange: "#EF6100",
          yellow: "#FDBB30"
        },
        ink: {
          DEFAULT: "#F0F4FF",
          muted: "#8B9DC3",
          dim: "#4A5578"
        }
      },
      fontFamily: {
        display: ["Oswald", "system-ui", "sans-serif"],
        cond: ["Barlow Condensed", "system-ui", "sans-serif"],
        sans: ["Barlow", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
