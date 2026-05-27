import { test as base, type Page } from '@playwright/test'

/**
 * Shared test fixture: every test starts with `/admin/api/**` mocked.
 *
 * The mocks live here (not per-test) so the contract — what shape the
 * backend MUST return for the UI to be happy — is documented in exactly
 * one place. If the UI starts calling something we haven't mocked, the
 * test fails with a clear unhandled-route error.
 */

export const FAKE_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.fake.token'

export const FAKE_USER = {
  id: 'u-1',
  publicId: 'pu-1',
  tenantId: 'default',
  loginId: 'admin',
  email: 'admin@example.com',
  status: 'ACTIVE',
}

export async function installApiMocks(page: Page) {
  // POST /auth/login → token + user
  await page.route('**/admin/api/v1/auth/login', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ token: FAKE_TOKEN, user: FAKE_USER }),
    })
  })

  // GET /users?tenantId=... → 3 fake users
  await page.route('**/admin/api/v1/users**', async (route) => {
    if (route.request().method() !== 'GET') return route.fallback()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: { value: 'u-1' },
          publicId: { value: 'pu-1' },
          tenantId: { value: 'default' },
          loginId: 'admin',
          email: 'admin@example.com',
          status: 'ACTIVE',
          locked: false,
          providerType: 'LOCAL',
        },
        {
          id: { value: 'u-2' },
          publicId: { value: 'pu-2' },
          tenantId: { value: 'default' },
          loginId: 'alice',
          email: 'alice@example.com',
          status: 'ACTIVE',
          locked: false,
          providerType: 'LOCAL',
        },
        {
          id: { value: 'u-3' },
          publicId: { value: 'pu-3' },
          tenantId: { value: 'default' },
          loginId: 'bob',
          email: null,
          status: 'LOCKED',
          locked: true,
          providerType: 'LOCAL',
        },
      ]),
    })
  })

  // GET /tenants → 2 fake tenants
  await page.route('**/admin/api/v1/tenants', async (route) => {
    if (route.request().method() !== 'GET') return route.fallback()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 'default', name: 'Default', status: 'ACTIVE', createdAt: '2026-01-01T00:00:00Z' },
        { id: 'acme', name: 'Acme Co', status: 'ACTIVE', createdAt: '2026-02-01T00:00:00Z' },
      ]),
    })
  })

  // GET /audit-logs → 2 fake events
  await page.route('**/admin/api/v1/audit-logs**', async (route) => {
    if (route.request().method() !== 'GET') return route.fallback()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        content: [
          {
            id: 'a-1',
            tenantId: 'default',
            actorId: 'u-1',
            actorLogin: 'admin',
            action: 'user.login',
            targetType: 'USER',
            targetId: 'u-1',
            outcome: 'SUCCESS',
            ip: '127.0.0.1',
            userAgent: 'Mozilla/5.0',
            payload: { hint: 'fixture' },
            occurredAt: '2026-05-28T10:00:00Z',
          },
          {
            id: 'a-2',
            tenantId: 'default',
            actorId: 'u-3',
            actorLogin: 'bob',
            action: 'user.login',
            targetType: 'USER',
            targetId: 'u-3',
            outcome: 'FAILURE',
            ip: '127.0.0.1',
            userAgent: 'Mozilla/5.0',
            payload: { reason: 'BAD_CREDENTIALS' },
            occurredAt: '2026-05-28T09:55:00Z',
          },
        ],
        totalElements: 2,
        totalPages: 1,
        number: 0,
        size: 25,
      }),
    })
  })
}

export const test = base.extend({
  page: async ({ page }, use) => {
    await installApiMocks(page)
    await use(page)
  },
})

export { expect } from '@playwright/test'
