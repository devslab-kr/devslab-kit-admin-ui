import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright config for devslab-kit-admin-ui smoke tests.
 *
 * The tests intercept every `/admin/api/**` call with `page.route()`,
 * so no real `devslab-kit-admin-api` instance is needed — we only need
 * the SPA to be served somewhere Playwright can navigate to.
 *
 * `webServer` boots `vite preview` against the production build, which
 * exercises the same bundle CI ships (rather than the dev server with
 * HMR / source maps). Trade-off: the test job has to `npm run build`
 * first.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['github']] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
