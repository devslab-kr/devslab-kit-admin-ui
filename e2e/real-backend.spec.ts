import { test, expect, REAL_BACKEND, REAL_ADMIN } from './fixtures'

/**
 * End-to-end suite that runs against a LIVE devslab-kit sample-app
 * (no mocks). Enable with E2E_BACKEND=real; skipped in the default
 * mock run.
 *
 * Prerequisites (the CI job and the local 3-terminal workflow both
 * satisfy these):
 *   - Postgres + Redis up
 *   - sample-app on :8080, seeded with admin/admin (SampleSeedRunner)
 *   - Vite dev server on :5173 proxying /admin/api → :8080
 *
 * The suite logs in once per test via the real login form, then drives
 * each admin surface against real data. Where it mutates, it creates a
 * uniquely-named row and deletes it again so reruns stay idempotent.
 */
test.describe('Real backend', () => {
  test.skip(!REAL_BACKEND, 'real-backend only (set E2E_BACKEND=real)')

  async function login(page: import('@playwright/test').Page) {
    await page.goto('/login')
    await page.getByLabel('Tenant').fill(REAL_ADMIN.tenantId)
    await page.getByLabel('Login ID').fill(REAL_ADMIN.loginId)
    await page.locator('#rawPassword').fill(REAL_ADMIN.password)
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/dashboard$/)
  }

  test('logs in as the seeded admin and lands on the dashboard', async ({ page }) => {
    await login(page)
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    // The seed creates exactly one tenant; the KPI widget reads the live count.
    await expect(page.getByTestId('kpi-tenants-value')).not.toHaveText('—')
  })

  test('Users page lists the seeded admin', async ({ page }) => {
    await login(page)
    await page.goto('/users')
    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible()
    await expect(page.getByText('admin', { exact: true }).first()).toBeVisible()
  })

  test('Permissions page shows the seeded admin.* catalogue', async ({ page }) => {
    await login(page)
    await page.goto('/permissions')
    await expect(page.getByRole('heading', { name: 'Permissions' })).toBeVisible()
    // SampleSeedRunner seeds 16 admin.* permissions; at least one must render.
    await expect(page.getByText('admin.user.read').first()).toBeVisible()
  })

  test('Roles page shows PLATFORM_ADMIN', async ({ page }) => {
    await login(page)
    await page.goto('/roles')
    await expect(page.getByRole('heading', { name: 'Roles' })).toBeVisible()
    await expect(page.getByText('PLATFORM_ADMIN').first()).toBeVisible()
  })

  test('Tenants page shows the default tenant with its status tag', async ({ page }) => {
    await login(page)
    await page.goto('/tenants')
    await expect(page.getByRole('heading', { name: 'Tenants' })).toBeVisible()
    // This row is exactly what backend #25 fixed (id was a {value} wrapper).
    await expect(page.getByText('default', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('ACTIVE').first()).toBeVisible()
  })

  test('Audit Logs page renders login events from the live feed', async ({ page }) => {
    await login(page)
    await page.goto('/audit-logs')
    await expect(page.getByRole('heading', { name: 'Audit logs' })).toBeVisible()
    // The login we just performed is recorded by the LoginAuditBridge.
    await expect(page.getByText('identity.login').first()).toBeVisible()
  })

  test('Settings page reads live DevslabKitProperties', async ({ page }) => {
    await login(page)
    await page.goto('/settings')
    await expect(page.getByRole('heading', { name: 'Platform settings' })).toBeVisible()
    // Secret must be masked, never the raw value.
    await expect(page.getByText('***').first()).toBeVisible()
  })

  test('Permission full CRUD round-trip through the UI', async ({ page }) => {
    const code = `e2e.probe.${Date.now()}`
    await login(page)
    await page.goto('/permissions')

    // Create — open the dialog from the header button, then scope all
    // interactions to the dialog so the header's own "Create" button (same
    // label) doesn't trip Playwright's strict-mode matcher.
    await page.getByRole('button', { name: 'Create' }).click()
    const dialog = page.getByRole('dialog', { name: 'Create permission' })
    await dialog.getByPlaceholder(/admin\.user\.read/).fill(code)
    await dialog.getByPlaceholder(/description/i).fill('e2e probe permission')
    await dialog.getByRole('button', { name: 'Create' }).click()
    await expect(page.getByText(code).first()).toBeVisible()

    // Delete (PrimeVue confirm dialog) — leaves the catalogue as we found it
    const row = page.getByRole('row', { name: new RegExp(code) })
    await row.getByLabel('Delete').click()
    await page.getByRole('dialog').getByRole('button', { name: /^(yes|delete|confirm)$/i }).click()
    await expect(page.getByText(code)).toHaveCount(0)
  })
})
