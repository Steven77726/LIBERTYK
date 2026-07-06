import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#16201b",
        cream: "#f7f5ef",
        moss: "#1f4d3b",
        sage: "#dce8df",
        gold: "#c7a868",
      },
      boxShadow: {
        soft: "0 18px 60px rgba(24, 39, 31, 0.08)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
