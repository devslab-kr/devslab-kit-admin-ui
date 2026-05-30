import { test, expect } from './fixtures'

test.describe('Login flow', () => {
  test('unauthenticated visit to / is redirected to /login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login(\?.*)?$/)
    await expect(page.getByText('devslab-kit admin')).toBeVisible()
  })

  test('signs in with valid credentials and lands on the dashboard', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel('Login ID').fill('admin')
    // PrimeVue Password renders as a wrapper; the actual input has id we set.
    await page.locator('#rawPassword').fill('correct-horse-battery-staple')

    await page.getByRole('button', { name: /sign in/i }).click()

    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })

  test('preserves ?redirect= and forwards back after login', async ({ page }) => {
    await page.goto('/users')
    // Vue Router preserves the path as-is in the query (no extra URL encoding),
    // so we just look for the `/users` substring rather than locking the encoding.
    await expect(page).toHaveURL(/\/login\?redirect=.*users/)

    await page.getByLabel('Login ID').fill('admin')
    await page.locator('#rawPassword').fill('pw')
    await page.getByRole('button', { name: /sign in/i }).click()

    await expect(page).toHaveURL(/\/users$/)
    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible()
  })
})
