/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Space Grotesk", "sans-serif"], // Override default sans
      },
      colors: {
        lightText: "#000000",
        darkText: "#FFFFFF",
        lightBg: "#FFFFFF",
        darkBg: "#292929",
      },
    },
  },
  plugins: [],
};
