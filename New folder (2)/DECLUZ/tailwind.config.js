/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dreamBlue: {
          deep: '#030b1e',
          dark: '#0a1c36',
          mid: '#1e4b85',
          light: '#0d1b2a',
        },
        cyanGlow: '#00f5ff',
        lavenderGlow: '#e6e6fa',
        neonBlue: '#0080ff',
        frostedWhite: 'rgba(255, 255, 255, 0.1)',
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        spaceGrotesk: ['"Space Grotesk"', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        cyan: '0 0 15px rgba(0, 245, 255, 0.5)',
        cyanThick: '0 0 30px rgba(0, 245, 255, 0.8)',
        blueGlow: '0 0 20px rgba(0, 128, 255, 0.6)',
        blueGlowThick: '0 0 35px rgba(0, 128, 255, 0.9)',
        lavender: '0 0 15px rgba(230, 230, 250, 0.4)',
      }
    },
  },
  plugins: [],
}
