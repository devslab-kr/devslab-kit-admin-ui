# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### Scaffold
- Vue 3 + Vite + TypeScript scaffold via `npm create vite`.
- PrimeVue 4 (Aura preset) + Tailwind CSS 4 + `tailwindcss-primeui` + PrimeIcons setup.
- Pinia stores: `auth` (token + current user in `localStorage`) and `ui` (light/dark theme toggle).
- Vue Router with route-level lazy loading and nav guards (redirect to `/login` when unauthenticated).
- axios client with `VITE_ADMIN_API_BASE_URL` env, Bearer interceptor, and 401 redirect.
- `authApi.login` wrapper targeting `POST /admin/api/v1/auth/login`.
- `LoginView`, `AppLayout` (sidebar + header + dark/light toggle + sign-out).
- Bilingual `README` / `README.ko.md`, Apache-2.0 `LICENSE`, this `CHANGELOG`.
- Vite dev proxy `/admin/api → http://localhost:8080`.

#### Bootstrap fix
- Wire `main.ts` to install Pinia, Vue Router, PrimeVue (Aura, `.dark` selector, `cssLayer: false`),
  ToastService and ConfirmationService — the initial scaffold left this as
  the default `createApp(App).mount('#app')` stub so every store and view was orphaned.
- Replace the Vite template `style.css` with `tailwindcss` + `tailwindcss-primeui` +
  PrimeIcons + the `.dark` custom variant.
- Add the `@/*` alias to both Vite (`resolve.alias`) and TypeScript
  (`compilerOptions.paths`, without the now-deprecated `baseUrl`).

#### CRUD pages
- **Users** — list / create / lock-unlock toggle / password reset / status change / delete (per-tenant).
- **Roles** — list / create / rename / delete (per-tenant).
- **Permissions** — list / create / edit description / delete.
- **Groups** — list / create / rename / delete (per-tenant); API wrapper also covers member and role grant/revoke endpoints for a follow-up detail drawer.
- **Menus** — PrimeVue TreeTable on the per-tenant menu tree, with add-root / add-child / edit (label / path / icon / required permission / display order) / delete.
- **Audit Logs** — lazy-paginated DataTable with filters (tenant, actor, action, target type, outcome, datetime range) and a detail dialog that pretty-prints the JSON payload.
- **Tenants** — list / create (id + name) / rename / status change (`ACTIVE` / `SUSPENDED` / `ARCHIVED`) / delete.
- **Policies (ABAC)** — list registered policies plus a Test dialog that dry-runs a `(subject, action, resource)` tuple through `PolicyEvaluator` with client-side JSON validation.
- **Diagnostics** — three side-effect-free probes: `login-test`, `permission-check`, `menu-visibility`.
- **Settings** — read-only view of the live `DevslabKitProperties` grouped by domain (JWT / tenant resolver / identity lockout / audit / menu), plus a paginated table of the raw `devslab.*` entries.

#### Dashboard
- Replace placeholder KPI cards with real data (current-tenant user count, tenant count, signed-in user) and a "Recent audit events" list with severity tags and timestamps. Per-widget failures degrade gracefully without breaking the rest of the dashboard.

#### Packaging
- Multi-stage `Dockerfile` (`node:24-alpine` build → `nginx:1.27-alpine` serve).
- `nginx.conf` with SPA fallback, immutable cache headers on `/assets/`, gzip on text MIME types, and `/admin/api/*` reverse-proxy to an upstream `admin-api:8080`.
- `docker-compose.yml` for local stack: postgres + redis + admin UI.
- `.dockerignore`.

#### CI
- `.github/workflows/ci.yml` — `npm ci` → `npm run build` → upload `dist/` artifact → Playwright smoke (Chromium, browsers cached via Playwright's installer) → Docker image build (Buildx + GHA cache, no push). Playwright HTML report uploaded as an artifact on failure.

#### E2E
- `@playwright/test` + `playwright.config.ts` (single Chromium project, `vite preview` as the webServer on `127.0.0.1:4173`, retries + traces / videos on failure in CI).
- Shared fixture in `e2e/fixtures.ts` that mocks every `/admin/api/**` call the smoke tests need (auth login, users list, tenants list, audit-logs search). The contract lives in exactly one place — if the SPA starts calling an unmocked endpoint, the test fails loudly.
- `e2e/login.spec.ts` — unauthenticated `/` redirects to `/login`, valid credentials land on `/dashboard`, `?redirect=` query is honoured after sign-in.
- `e2e/dashboard.spec.ts` — KPI widgets show the mocked counts (3 users, 2 tenants, current tenant + signed-in user from the seeded session) and the Recent audit events list shows both SUCCESS and FAILURE rows.
- Stable `data-testid`s on the dashboard widgets so assertions don't collide with sidebar nav labels (which use the same words).

#### i18n
- `vue-i18n` 11 set up under `src/i18n/`. Composition-mode (`legacy: false`), `globalInjection: true`, English / Korean message bundles in `src/i18n/locales/{en,ko}.ts` with a typed nested key tree.
- Initial locale detection: persisted choice in `localStorage` (`devslab-kit-admin-locale`) wins; otherwise infer from `navigator.language` (Korean for `ko-*`, English otherwise).
- `setLocale()` writes the choice back to `localStorage` and updates `<html lang>`.
- Locale toggle button in the `AppLayout` header (next to the theme toggle); shows the active code in caps (`EN` / `KO`) so users see which one they're in.
- Migrated shell strings to keys: `AppLayout` (sidebar group + item labels, header aria-labels), `LoginView` (form labels, submit, failure toast), `DashboardView` (page title, KPI labels, recent-events card, partial-failure toast). The 9 CRUD pages still use English labels and will migrate page-by-page in follow-up PRs — none of their backing API shapes change.

#### E2E
- `e2e/i18n.spec.ts` — toggling the locale swaps `Identity & Access` ↔ `아이덴티티 / 접근` and `Users` ↔ `사용자`, and the choice survives a reload.

### Notes
- The 9 CRUD pages still ship with hardcoded English labels; they migrate to `t('...')` keys in subsequent small PRs.
- Login flow currently expects `LoginResponse { token, user }` from the backend; matching `devslab-kit-admin-api` endpoints are landing in parallel on the kit side.
