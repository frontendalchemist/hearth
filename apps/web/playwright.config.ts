import { defineConfig, devices } from '@playwright/test'

// Where the tests run against. Local default is the dev server that
// `webServer` boots below; CI passes E2E_BASE_URL to point at a deployed
// preview (Netlify) when one is available.
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000'

// Skip booting our own dev server when E2E_BASE_URL is set — we're hitting
// a remote preview deploy and the local server isn't needed (or wanted).
const useExternalServer = Boolean(process.env.E2E_BASE_URL)

export default defineConfig({
  testDir: './e2e',
  // Smoke tests must be flake-resistant; the budget is intentionally tight so
  // a slow run is a signal, not the norm.
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  ...(useExternalServer
    ? {}
    : {
        webServer: {
          command: 'pnpm dev',
          url: baseURL,
          // Next dev compiles on first request, so the wait is generous.
          timeout: 120_000,
          // Reuse a server the developer already started outside the run;
          // in CI we always start a fresh one.
          reuseExistingServer: !process.env.CI,
        },
      }),
})
