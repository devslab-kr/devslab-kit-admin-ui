/// <reference types="node" />
import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright config for devslab-kit-admin-ui.
 *
 * Two modes, selected by the E2E_BACKEND env var:
 *
 *  - default (mock): tests intercept every `/admin/api/**` call with
 *    `page.route()`, so no backend is needed. `webServer` boots
 *    `vite preview` against the production build — exercising the same
 *    bundle CI ships.
 *
 *  - real (E2E_BACKEND=real): tests talk to a live `devslab-kit`
 *    sample-app. `webServer` runs `vite dev`, whose proxy forwards
 *    `/admin/api` → :8080. `globalSetup` health-checks the backend
 *    first. The mock-only specs skip themselves; `real-backend.spec.ts`
 *    runs only here.
 */
const REAL = process.env.E2E_BACKEND === 'real'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Real-backend mode runs serially: all tests log in as the same seeded
  // admin, and N browsers racing the same login transaction is flaky. The
  // mock suite has no shared state, so it keeps full parallelism.
  workers: process.env.CI ? 1 : REAL ? 1 : undefined,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['github']] : 'list',
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: REAL ? 'http://127.0.0.1:5173' : 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: REAL
    ? {
        command: 'npm run dev -- --host 127.0.0.1 --port 5173 --strictPort',
        url: 'http://127.0.0.1:5173',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      }
    : {
        command: 'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
        url: 'http://127.0.0.1:4173',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
})
