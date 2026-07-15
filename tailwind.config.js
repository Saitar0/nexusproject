/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0e141b',
        sidebar: '#171a21',
        accent: '#1a9fff',
      },
    },
  },
  plugins: [],
}
