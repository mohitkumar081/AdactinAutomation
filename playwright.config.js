import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  timeout: 180000,
  expect: { timeout: 30000 },

  fullyParallel: true,

  forbidOnly: !!process.env.CI,

  retries: process.env.CI ? 2 : 0,

  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['list'],

    ['html', { outputFolder: 'playwright-report' }],
    ['allure-playwright'],
  ],

  use: {
    actionTimeout: 60000,
    navigationTimeout: 60000,

    launchOptions: { args: ['--disable-dev-shm-usage'] },

    trace: 'on-first-retry',

    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

  ],

});
