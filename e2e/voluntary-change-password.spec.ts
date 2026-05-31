import { test, expect, REAL_BACKEND } from './fixtures'
import type { Page } from '@playwright/test'

// Mock-only: a normal (un-flagged) user changing their own password from the
// account menu. The shared fixture mocks /auth/login → FAKE_USER (no flag), so
// after login the user is on the dashboard, not pinned to the forced screen.
test.describe('voluntary password change', () => {
  test.skip(REAL_BACKEND, 'mock-only flow')

  async function mockChangePassword(page: Page) {
    await page.route('**/admin/api/v1/auth/change-password', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'fresh-token',
          // still un-flagged — voluntary change keeps the user where they are
          user: {
            id: 'u-1',
            publicId: 'pu-1',
            tenantId: 'default',
            loginId: 'admin',
            email: 'admin@example.com',
            status: 'ACTIVE',
            mustChangePassword: false,
          },
        }),
      })
    })
  }

  async function login(page: Page) {
    await page.goto('/login')
    await page.getByLabel(/login id|로그인 id/i).fill('admin')
    await page.getByLabel(/password|비밀번호/i).first().fill('admin')
    await page.getByRole('button', { name: /sign in|로그인/i }).click()
    await page.waitForURL(/\/dashboard/)
  }

  test('account menu opens the change-password page', async ({ page }) => {
    await mockChangePassword(page)
    await login(page)

    await page.getByTestId('account-menu-button').click()
    await page.getByRole('menuitem', { name: /change password|비밀번호 변경/i }).click()

    await expect(page).toHaveURL(/\/account\/change-password/)
    // Voluntary chrome: a Cancel button exists (forced mode shows Sign out only).
    await expect(page.getByRole('button', { name: /cancel|취소/i })).toBeVisible()
  })

  test('changing the password keeps the user in the app', async ({ page }) => {
    await mockChangePassword(page)
    await login(page)
    await page.goto('/account/change-password')

    const pw = 'another-strong-pw'
    await page.getByLabel(/current password|현재 비밀번호/i).fill('admin')
    await page.getByLabel(/new password|새 비밀번호/i).first().fill(pw)
    await page.getByLabel(/confirm|확인/i).fill(pw)
    await page.getByRole('button', { name: /change password|비밀번호 변경/i }).click()

    // Success toast appears, and the user stays put on the in-layout voluntary
    // page (no redirect to the forced standalone screen or to login). The form
    // resets for reuse — assert the current-password field is cleared.
    await expect(page.getByText(/password changed|비밀번호가 변경/i)).toBeVisible()
    await expect(page).toHaveURL(/\/account\/change-password/)
    await expect(page.getByLabel(/current password|현재 비밀번호/i)).toHaveValue('')
  })

  test('cancel returns to the dashboard', async ({ page }) => {
    await mockChangePassword(page)
    await login(page)
    await page.goto('/account/change-password')

    await page.getByRole('button', { name: /cancel|취소/i }).click()
    await expect(page).toHaveURL(/\/dashboard/)
  })
})
