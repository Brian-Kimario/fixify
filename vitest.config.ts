import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: [],
    // Unit tests only. Browser (Playwright), live-server and live-database
    // suites run through their own scripts (see test:e2e, test:oauth, test:live).
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
    exclude: [
      'node_modules/**',
      'tests/e2e/**',
      'tests/oauth-e2e.test.ts',
      'tests/phase3-state-machine.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
