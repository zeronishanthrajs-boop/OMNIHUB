/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        board: {
          light: '#e2e8f0',
          dark: '#64748b',
          accent: '#f59e0b',
          check: '#ef4444',
          highlight: 'rgba(250, 204, 21, 0.4)'
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-out forwards',
        popIn: 'popIn 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        popIn: {
          '0%': { opacity: '0', transform: 'scale(0.85)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        }
      }
    },
  },
  plugins: [],
}
