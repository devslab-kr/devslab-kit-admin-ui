import { test, expect, FAKE_TOKEN, FAKE_USER } from './fixtures'

test.describe('Locale toggle', () => {
  test.beforeEach(async ({ page }) => {
    // Seed auth on every navigation (cheap, idempotent). For the locale we
    // SET-IF-MISSING so the test's own toggle survives a reload — otherwise
    // addInitScript would clobber the persisted choice on every page load.
    await page.addInitScript(
      ([token, user]) => {
        localStorage.setItem('devslab-kit-admin-token', token)
        localStorage.setItem('devslab-kit-admin-user', user)
        if (!localStorage.getItem('devslab-kit-admin-locale')) {
          localStorage.setItem('devslab-kit-admin-locale', 'en')
        }
      },
      [FAKE_TOKEN, JSON.stringify(FAKE_USER)],
    )
  })

  test('toggling the locale swaps sidebar labels between EN and KO', async ({ page }) => {
    await page.goto('/dashboard')

    // EN baseline — sidebar group + items.
    await expect(page.getByText('Identity & Access')).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'Users' })).toBeVisible()

    // Click the locale toggle in the header.
    await page.getByTestId('locale-toggle').click()

    // KO — same widgets now render in Korean.
    await expect(page.getByText('아이덴티티 / 접근')).toBeVisible()
    await expect(page.getByRole('menuitem', { name: '사용자' })).toBeVisible()

    // The choice persists across reload.
    await page.reload()
    await expect(page.getByText('아이덴티티 / 접근')).toBeVisible()
  })
})
