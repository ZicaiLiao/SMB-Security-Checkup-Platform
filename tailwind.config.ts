import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        paper: "#f8fafc",
        ocean: "#0f766e",
        amber: "#d97706",
        rose: "#be123c"
      },
      fontFamily: {
        sans: [
          "\"Avenir Next\"",
          "\"PingFang SC\"",
          "\"Noto Sans SC\"",
          "sans-serif"
        ]
      },
      boxShadow: {
        panel: "0 24px 60px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
