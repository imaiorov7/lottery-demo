/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fef2f2',
          100: '#ffe1e1',
          200: '#ffc8c8',
          300: '#ffa3a3',
          400: '#ff6b6b',
          500: '#e94560',
          600: '#d12e4a',
          700: '#b0223c',
          800: '#931f35',
          900: '#7e1e32',
        },
      },
    },
  },
  plugins: [],
}
