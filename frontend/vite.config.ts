import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import TanStackRouterVite from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// if in ESM context
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  build: {
    emptyOutDir: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),

      '@app': path.resolve(__dirname, './bindings/github.com/hex-boost/hex-nexus-app/backend/app'),
      '@discord': path.resolve(__dirname, './bindings/github.com/hex-boost/hex-nexus-app/backend/discord'),
      '@league': path.resolve(__dirname, './bindings/github.com/hex-boost/hex-nexus-app/backend/league'),
      '@riot': path.resolve(__dirname, './bindings/github.com/hex-boost/hex-nexus-app/backend/riot'),
      '@repository': path.resolve(__dirname, './bindings/github.com/hex-boost/hex-nexus-app/backend/repository'),
      '@updater': path.resolve(__dirname, './bindings/github.com/hex-boost/hex-nexus-app/backend/updater'),
      '@events': path.resolve(__dirname, './bindings/github.com/hex-boost/hex-nexus-app/backend/events'),
      '@utils': path.resolve(__dirname, './bindings/github.com/hex-boost/hex-nexus-app/backend/utils'),
    },

  },
});
