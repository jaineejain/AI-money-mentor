
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: "#16a34a",
      },
      boxShadow: {
        soft: "0 18px 60px rgba(22, 163, 74, 0.12)",
      },
    },
  },
  plugins: [],
};
