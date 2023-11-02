import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default defineConfig(configEnv =>
  mergeConfig(
    viteConfig(configEnv),
    defineConfig({
      test: {
        environment: 'jsdom',
        globals: true,
        include: ['**/*.test.{ts,tsx}'],
        setupFiles: ['./src/setupTests.tsx'],
        mockReset: true,
        coverage: {
          provider: 'v8',
          all: true,
          include: ['src'],
          exclude: [
            '**/*.test.*',
            '**/*.d.ts',
            '**/types',
            '**/*.pact.ts',
            '**/queries/*',
            '**/testUtils.tsx',
            '**/setupTests.tsx',
            '**/pactUtils.ts',
          ],
          reporter: ['text', 'json', 'lcov', 'html'],
        },
      },
    })
  )
);
