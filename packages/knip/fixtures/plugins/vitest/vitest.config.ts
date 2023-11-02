import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    setupFiles: ['./setup.js', './src/setupTests.ts'],
    coverage: {
      reporter: ['html', 'lcov'],
      provider: 'istanbul',
    },
  },
});
