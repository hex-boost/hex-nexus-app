import path from 'node:path';
import { defineConfig, mergeConfig } from 'vite';
import baseConfig from '../../vite.config';

export default defineConfig(
  mergeConfig(baseConfig, {

    resolve: {
      alias: {
        // Ensure paths are relative to this package
        '@': path.resolve(__dirname, '../../packages/shared/src'),
      },
    },
    // Package-specific config
    build: {
      outDir: 'dist',
      sourcemap: true, // Source map generation must be turned on
    },
  }),
);
