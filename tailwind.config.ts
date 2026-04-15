import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "pg-white": "var(--white)",
        "pg-black": "var(--black)",
        "pg-gray-100": "var(--gray-100)",
        "pg-gray-200": "var(--gray-200)",
        "pg-gray-400": "var(--gray-400)",
        "pg-gray-700": "var(--gray-700)",
        "pg-gray-900": "var(--gray-900)",
        "pg-grid": "var(--grid)",
        "pg-accent": "var(--accent)",
        "pg-accent-muted": "var(--accent-muted)",
        "pg-accent-hover": "var(--accent-hover)",
      },
    },
  },
  plugins: [],
} satisfies Config;
