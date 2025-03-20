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
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),

      '@runtime': path.resolve(__dirname, 'wailsjs', 'runtime', 'runtime.js'),
      '@main': path.resolve(__dirname, 'wailsjs', 'go', 'main', 'App.js'),
      '@riot': path.resolve(__dirname, 'wailsjs', 'go', 'riot', 'Client.js'),

    },

  },
});
