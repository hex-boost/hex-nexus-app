import path, {dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import TanStackRouterVite from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [
    TanStackRouterVite({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared'),
      '@': path.resolve(__dirname, '../shared/src'),
      '@summonerClient': path.resolve(__dirname, './bindings/github.com/hex-boost/hex-nexus-app/backend/internal/league/summoner'),
      '@types': path.resolve(__dirname, './bindings/github.com/hex-boost/hex-nexus-app/backend/types'),

      '@manager': path.resolve(__dirname, './bindings/github.com/hex-boost/hex-nexus-app/backend/internal/updater'),
      '@client': path.resolve(__dirname, './bindings/github.com/hex-boost/hex-nexus-app/backend/client'),
      '@app': path.resolve(__dirname, './bindings/github.com/hex-boost/hex-nexus-app/backend/app'),
      '@discord': path.resolve(__dirname, './bindings/github.com/hex-boost/hex-nexus-app/backend/discord'),
      '@league': path.resolve(__dirname, './bindings/github.com/hex-boost/hex-nexus-app/backend/league'),
      '@riot': path.resolve(__dirname, './bindings/github.com/hex-boost/hex-nexus-app/backend/riot'),
      '@repository': path.resolve(__dirname, './bindings/github.com/hex-boost/hex-nexus-app/backend/repository'),
      '@updater': path.resolve(__dirname, './bindings/github.com/hex-boost/hex-nexus-app/backend/updater'),
      '@events': path.resolve(__dirname, './bindings/github.com/hex-boost/hex-nexus-app/backend/events'),
      '@utils': path.resolve(__dirname, './bindings/github.com/hex-boost/hex-nexus-app/backend/utils'),
      '@stripe': path.resolve(__dirname, './bindings/github.com/hex-boost/hex-nexus-app/backend/stripe'),
      '@overlay': path.resolve(__dirname, './bindings/github.com/hex-boost/hex-nexus-app/backend/overlay'),
      '@time': path.resolve(__dirname, './bindings/time'),

    },

  },
});
