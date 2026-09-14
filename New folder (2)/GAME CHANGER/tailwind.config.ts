import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      boxShadow: {
        soft: "0 4px 20px rgba(0, 0, 0, 0.04)"
      },
      borderRadius: {
        premium: "16px"
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "40px"
      },
      maxWidth: {
        content: "1240px"
      }
    }
  },
  plugins: []
};

export default config;
