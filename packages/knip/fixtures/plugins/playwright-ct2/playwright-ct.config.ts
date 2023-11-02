const defineConfig = c => c;

export default defineConfig({
  testDir: './tests/component',
  testMatch: ['**/*.spec.ts'],
  projects: [
    {
      name: 'chromium',
    },
  ],
});
