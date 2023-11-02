import type { PlaywrightTestConfig } from '@playwright/test';
import { devices } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: '.',
  testMatch: ['**/*-test.ts'],
  projects: [
    {
      name: 'chromium',
      use: devices['Desktop Chrome'],
    },
    {
      name: 'webkit',
      use: devices['Desktop Safari'],
    },
  ],
};

export default config;
