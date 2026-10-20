import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/test/integration/recommendation.integration.spec.ts',
      '**/test/e2e/**/*.e2e.spec.ts',
    ],
  },
});
