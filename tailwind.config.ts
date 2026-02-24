import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        base: "#030508",
        card: "#080d14",
        card2: "#0c1420",
        cyan: { DEFAULT: "#00c8ff", dim: "rgba(0,200,255,0.15)" },
        neon: { green: "#00ff87", orange: "#ff7043", red: "#ff3d57", yellow: "#ffd60a" },
      },
      fontFamily: {
        display: ["Syne", "sans-serif"],
        body: ["Outfit", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
