/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],

  theme: {
    extend: {
      colors: {
        background: "oklch(var(--background))",
        foreground: "oklch(var(--foreground))",

        card: "oklch(var(--card))",
        "card-dark": "oklch(var(--card))",

        primary: "oklch(var(--primary))",
        accent: "oklch(var(--accent))",

        border: "oklch(var(--border))",

        muted: "oklch(var(--muted))",
        "muted-foreground": "oklch(var(--muted-foreground))",
      },

      fontFamily: {
        display: ["Bricolage Grotesque"],
      },
    },
  },

  plugins: [],
};