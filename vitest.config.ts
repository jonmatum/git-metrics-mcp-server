import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: ['build/**', 'node_modules/**', '**/*.config.ts', '**/*.test.ts'],
      thresholds: {
        lines: 73,
        functions: 73,
        branches: 73,
        statements: 73,
      },
    },
  },
});
