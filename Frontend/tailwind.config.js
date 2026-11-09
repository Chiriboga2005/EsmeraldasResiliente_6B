/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        crisis: {
          900: '#0b1120',
          800: '#0f172a',
          700: '#1e293b',
          600: '#334155',
          accent: '#38bdf8',
          danger: '#ef4444',
          warning: '#f59e0b',
          success: '#10b981',
        }
      }
    },
  },
  plugins: [],
}
