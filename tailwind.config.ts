import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0a0a0a",
        paper: "#f4f1e8",
        acid: "#ffe600",
        alert: "#ff2d2d",
        sick: "#00e0a4",
      },
      fontFamily: {
        mono: ["'Space Mono'", "'Courier New'", "monospace"],
      },
      boxShadow: {
        brutal: "8px 8px 0 0 #0a0a0a",
        brutalSm: "4px 4px 0 0 #0a0a0a",
      },
    },
  },
  plugins: [],
};

export default config;
