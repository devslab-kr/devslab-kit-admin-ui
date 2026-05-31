import { test, expect, REAL_BACKEND, FAKE_USER, FAKE_TOKEN } from './fixtures'
import type { Page } from '@playwright/test'

// Mock-only: drives the forced-rotation flow end to end. Skipped against a real
// backend (we can't put the live admin into a must-change state on demand).
//
// The shared fixture already mocks POST /auth/login to return FAKE_USER (no
// flag). Here we register narrower routes AFTER it — Playwright matches the most
// recently added handler first — to override login with a must-change user and
// to mock the change-password endpoint.
test.describe('forced password change', () => {
  test.skip(REAL_BACKEND, 'mock-only flow')

  const MUST_CHANGE_USER = { ...FAKE_USER, mustChangePassword: true }
  const ROTATED_USER = { ...FAKE_USER, mustChangePassword: false }

  async function overrideAuthRoutes(page: Page) {
    await page.route('**/admin/api/v1/auth/login', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: FAKE_TOKEN, user: MUST_CHANGE_USER }),
      })
    })
    await page.route('**/admin/api/v1/auth/change-password', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: 'rotated-token', user: ROTATED_USER }),
      })
    })
  }

  async function login(page: Page) {
    await page.goto('/login')
    await page.getByLabel(/login id|로그인 id/i).fill('admin')
    await page.getByLabel(/password|비밀번호/i).first().fill('admin')
    await page.getByRole('button', { name: /sign in|로그인/i }).click()
  }

  test('login with the flag set redirects to change-password', async ({ page }) => {
    await overrideAuthRoutes(page)
    await login(page)
    await expect(page).toHaveURL(/\/change-password/)
    await expect(
      page.getByRole('button', { name: /change password|비밀번호 변경/i }),
    ).toBeVisible()
  })

  test('a flagged user cannot navigate away', async ({ page }) => {
    await overrideAuthRoutes(page)
    await login(page)
    await page.waitForURL(/\/change-password/)
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/change-password/)
  })

  test('completing the change unlocks the app', async ({ page }) => {
    await overrideAuthRoutes(page)
    await login(page)
    await page.waitForURL(/\/change-password/)

    const pw = 'new-strong-password'
    await page.getByLabel(/current password|현재 비밀번호/i).fill('admin')
    await page.getByLabel(/new password|새 비밀번호/i).first().fill(pw)
    await page.getByLabel(/confirm|확인/i).fill(pw)

    await page.getByRole('button', { name: /change password|비밀번호 변경/i }).click()
    await expect(page).not.toHaveURL(/\/change-password/)
  })
})
