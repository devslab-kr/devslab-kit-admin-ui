/**
 * Playwright global setup. Only does work in real-backend mode
 * (E2E_BACKEND=real): it fails fast with an actionable message if the
 * sample-app isn't reachable, so a misconfigured run doesn't surface as
 * a pile of confusing per-test timeouts.
 */
async function globalSetup() {
  if (process.env.E2E_BACKEND !== 'real') {
    return
  }
  const base = process.env.E2E_BACKEND_URL ?? 'http://localhost:8080'
  const url = `${base}/admin/api/v1/auth/login`
  const body = JSON.stringify({ tenantId: 'default', loginId: 'admin', rawPassword: 'admin' })

  const deadline = Date.now() + 60_000
  let lastErr: unknown
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })
      if (res.ok) {
        return
      }
      lastErr = `HTTP ${res.status}`
    } catch (e) {
      lastErr = e
    }
    await new Promise((r) => setTimeout(r, 2000))
  }

  throw new Error(
    `[e2e:real] sample-app not reachable / admin login failing at ${url} ` +
      `(last: ${String(lastErr)}). Start it with:\n` +
      `  docker compose up -d postgres redis   (in devslab-kit-admin-ui)\n` +
      `  ./gradlew :devslab-kit-sample-app:bootRun   (in devslab-kit, with DEVSLAB_* env)\n` +
      `then re-run with E2E_BACKEND=real.`,
  )
}

export default globalSetup
