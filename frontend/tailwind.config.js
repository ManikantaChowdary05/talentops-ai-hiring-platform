/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9eaff',
          200: '#bcdbff',
          300: '#8ec4ff',
          400: '#59a2ff',
          500: '#2f7eff',
          600: '#155dfc',
          700: '#0e46e6',
          800: '#1239b9',
          900: '#143391',
          950: '#0f1f58',
        },
        navy: {
          800: '#0f172a',
          850: '#0b1120',
          900: '#070d19',
          950: '#030712',
        }
      }
    },
  },
  plugins: [],
}
