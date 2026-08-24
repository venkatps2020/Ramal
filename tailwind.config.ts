import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        parchment: "#ece7da",
        ink: "#2a241c",
        accent: "#3b4a6b",
        brass: "#8a6a3c",
      },
      fontFamily: {
        serif: ["Georgia", "Iowan Old Style", "Palatino Linotype", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
