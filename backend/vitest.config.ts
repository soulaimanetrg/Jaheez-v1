import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    root: './src',
    include: ['**/*.test.ts'],
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'lcov'],
      include: ['features/**/*.service.ts', 'features/**/*.repository.ts'],
      exclude: ['**/node_modules/**', '**/test/**'],
      thresholds: {
        // Start with reasonable thresholds, increase over time
        statements: 50,
        branches: 40,
        functions: 50,
        lines: 50,
      },
    },
    testTimeout: 10000,
  },
});
