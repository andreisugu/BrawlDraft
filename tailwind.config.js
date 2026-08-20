/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brawl: {
          yellow: '#FFDE00',
          orange: '#FF8800',
          blue: '#0088FF',
          darkBlue: '#0D1B2A',
          purple: '#8A2BE2',
          red: '#FF2E4D',
          dark: '#111827',
          card: '#1E293B',
          border: '#334155'
        }
      },
      fontFamily: {
        brawl: ['Lilita One', 'Impact', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
