import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: "class",
  content: ["./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#faf7f2",
        ink: "#1a1a1a",
        charcoal: "#1e1e1e",
        gold: "#c4a030",
        accent: "#3b6e8e",
        muted: "#8a8a8a",
        faint: "#c4c0ba",
        rule: "#e8e4de",
        body: "#4a4a4a",
      },
      fontFamily: {
        display: ["Fraunces", "Times New Roman", "Georgia", "serif"],
        sans: ["DM Sans", "SF Pro Display", "PingFang SC", "Microsoft YaHei", "system-ui", "sans-serif"],
        mono: ["DM Mono", "SF Mono", "Consolas", "monospace"],
      },
      borderRadius: {
        sm: "8px",
        md: "14px",
        lg: "18px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.03), 0 2px 8px rgba(0,0,0,0.02)",
        "card-md": "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)",
      },
    },
  },
}

export default config
