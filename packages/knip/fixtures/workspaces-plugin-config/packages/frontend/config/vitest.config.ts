import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    include: ['**/*.vitest.ts'],
    environment: 'jsdom',
  },
});
