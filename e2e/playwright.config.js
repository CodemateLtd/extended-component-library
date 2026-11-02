/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {defineConfig, devices} from '@playwright/test';

/** See https://playwright.dev/docs/test-configuration. */
export default defineConfig({
  testDir: '.',
  fullyParallel: true,
  /* Fail the build on CI if accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See
     https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Collect trace when retrying the failed test. See
       https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },
  
  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {...devices['Desktop Chrome']},
    },
    {
      name: 'firefox',
      use: {...devices['Desktop Firefox']},
    },
    /* WebKit on Linux, where CI runs, focuses a button when it is clicked,
       but WebKit on macOS, like Safari, does not. Tests that depend on where
       a mouse click leaves focus pass on Linux and may fail on a Mac. WebKit
       on macOS also skips links on Tab, as Safari does by default. */
    {
      name: 'webkit',
      use: {...devices['Desktop Safari']},
    },
  ],
});
