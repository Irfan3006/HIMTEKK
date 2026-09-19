/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./404.html",
    "./pages/**/*.{html,js}",
    "./js/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#00406E',
        secondary: '#FFFFFF',
        accent: '#DBB865',
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      },
      backgroundImage: {
        'hero-pattern': "linear-gradient(rgba(0, 64, 110, 0.8), rgba(0, 64, 110, 0.9)), url('../assets/img/hero.webp')",
      }
    },
  },
  plugins: [],
}
