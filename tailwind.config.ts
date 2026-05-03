import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        orbitron: ["var(--font-orbitron)", "sans-serif"],
      },
      colors: {
        background: "#0a0a0c", // Deep dark
        surface: "rgba(255, 255, 255, 0.03)", // Dark card background
        surfaceBorder: "rgba(255, 255, 255, 0.08)",
        primary: "#6d28d9", // Original Morphic purple
        primaryGlow: "rgba(109, 40, 217, 0.2)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config;
