import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    specPattern: '**/*.e2e.js',
  },
  component: {
    specPattern: ['**/*.component.js'],
  },
});
