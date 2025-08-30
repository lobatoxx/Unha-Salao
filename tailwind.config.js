// tailwind.config.js (Verificação)
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./admin.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Garante que ele olhe dentro da pasta src
  ],
  theme: {
    extend: {
      colors: {
        'custom-pink': '#EC4899',
      },
    },
  },
  plugins: [],
}