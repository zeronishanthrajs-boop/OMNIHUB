import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 3000,
    watch: {
      ignored: ["**/static/speech/**"]
    },
    proxy: {
      "/api": "http://127.0.0.1:3001",
      "/events": "http://127.0.0.1:3001"
    }
  },
  build: {
    target: "es2022",
    sourcemap: true,
    chunkSizeWarningLimit: 1200,
    rolldownOptions: {
      checks: {
        pluginTimings: false
      }
    }
  }
});
