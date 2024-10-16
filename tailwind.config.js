/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './views/**/*.ejs',   // Tambahkan path ini agar Tailwind dapat menemukan file EJS kamu
    './public/**/*.js'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
