import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-raised": "var(--surface-raised)",
        border: "var(--border)",
        text: "var(--text)",
        "text-dim": "var(--text-dim)",
        accent: "var(--accent)",
        "accent-text": "var(--accent-text)",
        ok: "var(--ok)",
        warn: "var(--warn)",
        danger: "var(--danger)",
        info: "var(--info)",
      },
    },
  },
  plugins: [],
};
export default config;
