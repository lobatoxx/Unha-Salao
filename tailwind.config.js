/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html", // Escaneia o index.html
    "./src/**/*.{js,ts,jsx,tsx}", // Escaneia arquivos na pasta src
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
