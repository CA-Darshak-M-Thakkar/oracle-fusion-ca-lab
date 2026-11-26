/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      colors: {
        oracle: {
          sky: '#00688C',
          skyLight: '#56A3D5',
          skyBg: '#83BFE5',
          redwood: '#C74634',
          slate: '#312D2A',
          panel: '#F8F9FA',
          border: '#D6DFE6',
          teal: '#0572CE',
        }
      }
    },
  },
  plugins: [],
}
