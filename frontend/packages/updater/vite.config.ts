import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import TanStackRouterVite from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [
    TanStackRouterVite({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },

      output: { dir: '../../../backend/cmd/updater/dist' },
    },
  },
  resolve: {
    alias: {
      '@manager': path.resolve(__dirname, '../updater/bindings/github.com/hex-boost/hex-nexus-app/backend/cmd/updater/manager'),
      '@': path.resolve(__dirname, '../shared/src'),
    },

  },

});
