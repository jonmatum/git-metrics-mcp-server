import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: ['build/**', 'node_modules/**', '**/*.config.ts', '**/*.test.ts'],
      thresholds: {
        // Overall thresholds (includes server setup code which can't be unit tested)
        lines: 80,
        functions: 76,
        branches: 77,
        statements: 80,
        // Per-file thresholds for business logic (handlers.ts has 90%+ coverage)
        'handlers.ts': {
          lines: 91,
          functions: 82,
          branches: 86,
          statements: 89,
        },
      },
    },
  },
});
