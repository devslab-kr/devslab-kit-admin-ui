import { test, expect, FAKE_TOKEN, FAKE_USER } from './fixtures'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Seed an authenticated session directly so the test focuses on the
    // dashboard widgets, not the login form (covered by login.spec.ts).
    await page.addInitScript(
      ([token, user]) => {
        localStorage.setItem('devslab-kit-admin-token', token)
        localStorage.setItem('devslab-kit-admin-user', user)
      },
      [FAKE_TOKEN, JSON.stringify(FAKE_USER)],
    )
  })

  test('renders KPI widgets backed by the mocked API', async ({ page }) => {
    await page.goto('/dashboard')

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

    // KPI values — sidebar menu items use the same words, so we scope by testid.
    await expect(page.getByTestId('kpi-users-value')).toHaveText('3')
    await expect(page.getByTestId('kpi-tenants-value')).toHaveText('2')
    await expect(page.getByTestId('kpi-current-tenant-value')).toHaveText('default')
    await expect(page.getByTestId('kpi-signed-in-value')).toHaveText('admin')

    // Recent audit events list.
    const events = page.getByTestId('recent-events')
    await expect(events).toContainText('Recent audit events')
    await expect(events).toContainText('user.login')
    await expect(events).toContainText('SUCCESS')
    await expect(events).toContainText('FAILURE')
  })
})
