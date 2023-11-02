import { defineConfig, devices } from '@playwright/experimental-ct-react';

export default defineConfig({
  projects: [
    {
      name: 'chromium',
      use: devices['Desktop Chrome'],
    },
  ],
});
