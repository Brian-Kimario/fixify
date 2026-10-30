import { defineConfig } from 'vitest/config';
import path from 'path';

// Suites that need a running dev server or a live Supabase project.
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/oauth-e2e.test.ts', 'tests/phase3-state-machine.test.ts', 'tests/security/r0-live.test.ts'],
    testTimeout: 30000,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
