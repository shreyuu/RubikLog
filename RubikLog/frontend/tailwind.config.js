/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cubeColors: {
          white: "#FFFFFF",
          yellow: "#FFD500",
          red: "#B71234",
          orange: "#FF5800",
          blue: "#0046AD",
          green: "#009B48",
        },
      },
    },
  },
  plugins: [],
};
