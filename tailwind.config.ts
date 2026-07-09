import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0a0b0f",
          900: "#111319",
          800: "#181b23",
          700: "#232733",
          600: "#2e3341",
          500: "#454c5e",
          400: "#6b7284",
          300: "#9aa0af",
          200: "#c6cad3",
          100: "#e9eaee",
        },
        brand: {
          500: "#6d5efc",
          400: "#8b7ffd",
          300: "#a9a0fe",
        },
      },
    },
  },
  plugins: [],
};
export default config;
