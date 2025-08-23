import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { sentryVitePlugin } from '@sentry/vite-plugin';
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
    sentryVitePlugin({
      org: 'nexus-cj',
      project: 'javascript-react',
      authToken: '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',
      release: {
        name: process.env.NODE_ENV || 'development',
        dist: 'app-frontend',
      },

    }),
  ],

  resolve: {
    alias: {
      // This is the key change - ensure this works for imports from both packages
      '@': path.resolve(__dirname, 'packages/shared/src'),
      '@summonerClient': path.resolve(__dirname, 'packages/main/bindings/github.com/hex-boost/hex-nexus-app/backend/internal/league/summoner'),
      '@accountState': path.resolve(__dirname, 'packages/main/bindings/github.com/hex-boost/hex-nexus-app/backend/internal/league/account/state'),

      '@logger': path.resolve(__dirname, 'packages/main/bindings/github.com/hex-boost/hex-nexus-app/backend/pkg/logger'),
      '@types': path.resolve(__dirname, 'packages/main/bindings/github.com/hex-boost/hex-nexus-app/backend/types'),
      '@shared': path.resolve(__dirname, 'packages/shared'),
      '@app': path.resolve(__dirname, 'packages/main/bindings/github.com/hex-boost/hex-nexus-app/backend/app'),
      '@client': path.resolve(__dirname, 'packages/main/bindings/github.com/hex-boost/hex-nexus-app/backend/client'),
      '@lolskin': path.resolve(__dirname, 'packages/main/bindings/github.com/hex-boost/hex-nexus-app/backend/internal/league/tools/lolskin'),
      '@hwid': path.resolve(__dirname, 'packages/main/bindings/github.com/hex-boost/hex-nexus-app/backend/pkg/hwid'),
      '@leagueManager': path.resolve(__dirname, 'packages/main/bindings/github.com/hex-boost/hex-nexus-app/backend/internal/league/manager'),
      '@manager': path.resolve(__dirname, 'packages/updater/bindings/github.com/hex-boost/hex-nexus-app/backend/internal/updater'),
      '@account': path.resolve(__dirname, 'packages/main/bindings/github.com/hex-boost/hex-nexus-app/backend/internal/league/account'),

      '@discord': path.resolve(__dirname, 'packages/main/bindings/github.com/hex-boost/hex-nexus-app/backend/discord'),
      '@league': path.resolve(__dirname, 'packages/main/bindings/github.com/hex-boost/hex-nexus-app/backend/internal/league'),
      '@riot': path.resolve(__dirname, 'packages/main/bindings/github.com/hex-boost/hex-nexus-app/backend/riot'),
      '@repository': path.resolve(__dirname, 'packages/main/bindings/github.com/hex-boost/hex-nexus-app/backend/repository'),
      '@updater': path.resolve(__dirname, 'packages/main/bindings/github.com/hex-boost/hex-nexus-app/backend/internal/updater'),
      '@events': path.resolve(__dirname, 'packages/main/bindings/github.com/hex-boost/hex-nexus-app/backend/events'),
      '@utils': path.resolve(__dirname, 'packages/main/bindings/github.com/hex-boost/hex-nexus-app/backend/utils'),
      '@stripe': path.resolve(__dirname, 'packages/main/bindings/github.com/hex-boost/hex-nexus-app/backend/stripe'),
      '@overlay': path.resolve(__dirname, 'packages/main/bindings/github.com/hex-boost/hex-nexus-app/backend/overlay'),
      '@time': path.resolve(__dirname, 'packages/main/bindings/time'),
    },
  },

});
