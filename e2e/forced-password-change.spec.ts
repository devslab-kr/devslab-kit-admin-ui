import { test, expect, REAL_BACKEND, REAL_ADMIN, MOCK_USER } from './fixtures'
import type { Page } from '@playwright/test'

// Mock-only: drives the forced-rotation flow end to end. Skipped against a real
// backend (we can't force the live admin into a must-change state on demand).
test.describe('forced password change', () => {
  test.skip(REAL_BACKEND, 'mock-only flow')

  const MUST_CHANGE_USER = { ...MOCK_USER, mustChangePassword: true }
  const ROTATED_USER = { ...MOCK_USER, mustChangePassword: false }

  async function installRoutes(page: Page) {
    await page.route('**/admin/api/v1/**', async (route) => {
      const url = route.request().url()
      const method = route.request().method()

      if (url.endsWith('/auth/login') && method === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ token: 'mock-must-change-token', user: MUST_CHANGE_USER }),
        })
        return
      }
      if (url.endsWith('/auth/change-password') && method === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ token: 'mock-rotated-token', user: ROTATED_USER }),
        })
        return
      }
      // Everything else (dashboard widgets etc.) → benign empty shapes.
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          url.includes('/users')
            ? { content: [MOCK_USER], totalElements: 1, page: 0, size: 20 }
            : url.includes('/tenants')
              ? [{ id: 'default', name: 'Default', status: 'ACTIVE' }]
              : url.includes('/audit-logs')
                ? { content: [], totalElements: 0, page: 0, size: 20 }
                : {},
        ),
      })
    })
  }

  async function doLogin(page: Page) {
    await page.goto('/login')
    await page.getByLabel(/login id|로그인 id/i).fill(REAL_ADMIN.loginId)
    await page.getByLabel(/password|비밀번호/i).first().fill(REAL_ADMIN.password)
    await page.getByRole('button', { name: /sign in|로그인/i }).click()
  }

  test('login with must-change-password redirects to the change-password screen', async ({
    page,
  }) => {
    await installRoutes(page)
    await doLogin(page)
    await expect(page).toHaveURL(/\/change-password/)
    await expect(
      page.getByRole('button', { name: /change password|비밀번호 변경/i }),
    ).toBeVisible()
  })

  test('a flagged user cannot escape to another route', async ({ page }) => {
    await installRoutes(page)
    await doLogin(page)
    await page.waitForURL(/\/change-password/)
    // Try to jump straight to the dashboard — the guard must pin us back.
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/change-password/)
  })

  test('completing the change unlocks the dashboard', async ({ page }) => {
    await installRoutes(page)
    await doLogin(page)
    await page.waitForURL(/\/change-password/)

    const pw = 'new-strong-password'
    // current, new, confirm — three Password inputs in document order.
    const inputs = page.locator('input[type="password"]')
    await page.getByLabel(/current password|현재 비밀번호/i).fill(REAL_ADMIN.password)
    await page.getByLabel(/new password|새 비밀번호/i).first().fill(pw)
    await page.getByLabel(/confirm|확인/i).fill(pw)
    void inputs

    await page.getByRole('button', { name: /change password|비밀번호 변경/i }).click()
    await expect(page).toHaveURL(/\/dashboard/)
  })
})
