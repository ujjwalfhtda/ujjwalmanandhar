/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#f5b93d",
          hover: "#ffd166",
          dim: "rgba(245,185,61,0.12)",
        },
        ink: {
          950: "#060b16",
          900: "#0a1222",
          800: "#0f1b33",
          700: "#16263f",
          600: "#1e3254",
        },
      },
      fontFamily: {
        sans: ["Inter", "Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,.05), 0 8px 24px -12px rgba(0,0,0,.25)",
      },
    },
  },
  plugins: [],
};