/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        jarvis: {
          bg: "#050A14",
          panel: "#0A1628",
          cyan: "#00D4FF",
          purple: "#7C4DFF",
          teal: "#00BCD4",
          orange: "#FF9800",
          red: "#FF3D3D",
          text: "#E8F4FF",
          muted: "#4A6FA5",
          border: "#1A2F4A"
        }
      },
      fontFamily: {
        display: ["Rajdhani", "Orbitron", "sans-serif"],
        body: ["IBM Plex Sans", "Rajdhani", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"]
      }
    }
  },
  plugins: []
};
