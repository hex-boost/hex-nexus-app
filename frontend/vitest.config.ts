// frontend/vitest.config.ts
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'], // Create this file if needed
    mockReset: true,
  },
  plugins: [tsconfigPaths()],
});
