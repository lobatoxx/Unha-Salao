// tailwind.config.js
const colors = require('tailwindcss/colors')

module.exports = {
  content: [
    "./index.html",
    "./admin.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pink: colors.pink,
        purple: colors.purple,
        blue: colors.blue,
        green: colors.green,
        gray: colors.gray,
      },
    },
  },
  plugins: [],
}
