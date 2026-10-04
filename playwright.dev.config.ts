import { defineConfig } from '@playwright/test';
import production, { fixture } from './playwright.config';

export default defineConfig({
  ...production,
  testDir: './tests/dev',
  use: { ...production.use, baseURL: 'http://127.0.0.1:4335' },
  webServer: {
    command: 'npm run dev -- --port 4335 --ignore-lock',
    url: 'http://127.0.0.1:4335',
    reuseExistingServer: false,
    timeout: 60000,
    env: fixture,
  },
});
