import { devices } from '@playwright/test';
import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  projects: [
    {
      name: 'chromium',
      use: devices['Desktop Chrome'],
    },
  ],
};

export default config;
