import path, { dirname } from 'node:path';

import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import TanStackRouterVite from '@tanstack/router-plugin/vite';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  test: {
    globals: true,
  },
  plugins: [
    TanStackRouterVite({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // This is the key change - ensure this works for imports from both packages
      '@': path.resolve(__dirname, 'packages/shared/src'),
      '@shared': path.resolve(__dirname, 'packages/shared'),
      '@app': path.resolve(__dirname, 'packages/main/bindings/github.com/hex-boost/hex-nexus-app/backend/app'),
      // Keep other aliases
      '@discord': path.resolve(__dirname, 'packages/main/bindings/github.com/hex-boost/hex-nexus-app/backend/discord'),
      '@league': path.resolve(__dirname, 'packages/main/bindings/github.com/hex-boost/hex-nexus-app/backend/league'),
      '@riot': path.resolve(__dirname, 'packages/main/bindings/github.com/hex-boost/hex-nexus-app/backend/riot'),
      '@repository': path.resolve(__dirname, 'packages/main/bindings/github.com/hex-boost/hex-nexus-app/backend/repository'),
      '@updater': path.resolve(__dirname, 'packages/main/bindings/github.com/hex-boost/hex-nexus-app/backend/updater'),
      '@events': path.resolve(__dirname, 'packages/main/bindings/github.com/hex-boost/hex-nexus-app/backend/events'),
      '@utils': path.resolve(__dirname, 'packages/main/bindings/github.com/hex-boost/hex-nexus-app/backend/utils'),
      '@stripe': path.resolve(__dirname, 'packages/main/bindings/github.com/hex-boost/hex-nexus-app/backend/stripe'),
      '@overlay': path.resolve(__dirname, 'packages/main/bindings/github.com/hex-boost/hex-nexus-app/backend/overlay'),
      '@time': path.resolve(__dirname, 'packages/main/bindings/time'),
    },
  },
});
