/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        bg: "var(--bg)",
        bg2: "var(--bg2)",
        solid: "var(--solid)",
        surface: "var(--surface)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        accent: {
          DEFAULT: "var(--accent)",
          ink: "var(--accent-ink)",
        },
        line: "var(--line)",
        ok: "var(--ok)",
        warn: "var(--warn)",
        bad: "var(--bad)",
        info: "var(--info)",
        border: "var(--line)",
        background: "var(--bg)",
        foreground: "var(--ink)",
      },
      borderRadius: {
        xl: "12px",
        "2xl": "20px",
        "3xl": "28px",
      },
      fontFamily: {
        sans: [
          "Geist",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      letterSpacing: {
        tightest: "-0.035em",
        tighter: "-0.025em",
      },
    },
  },
  plugins: [],
};
