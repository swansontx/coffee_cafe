/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'coffee-brown': '#6F4E37',
        'espresso': '#3D2817',
        'cream': '#FFF8DC',
      },
    },
  },
  plugins: [],
}
