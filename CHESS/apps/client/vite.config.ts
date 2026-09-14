import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@cinematic-chess/chess-core': path.resolve(__dirname, '../../packages/chess-core/src'),
      '@cinematic-chess/shared-types': path.resolve(__dirname, '../../packages/shared-types/src')
    }
  },
  server: {
    port: 3000,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  }
});
