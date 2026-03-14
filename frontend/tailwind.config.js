/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Noto Sans Devanagari", "Segoe UI", "sans-serif"],
        hindi: ["Noto Sans Devanagari", "sans-serif"]
      },
      boxShadow: {
        gov: "0 1px 3px rgba(15, 23, 42, 0.12)"
      },
      colors: {
        gov: {
          primary: "#f28c28",
          sidebar: "#f5f5f5",
          success: "#4caf50",
          warning: "#ff9800",
          error: "#f44336",
          info: "#2196f3",
          border: "#d6d9de",
          page: "#edf1f5",
          section: "#f8f8f8"
        }
      }
    }
  },
  plugins: []
};
