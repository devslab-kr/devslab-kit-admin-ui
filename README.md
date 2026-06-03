# devslab-kit-admin-ui

[한국어 README](README.ko.md)

Vue 3 admin console for [devslab-kr/devslab-kit](https://github.com/devslab-kr/devslab-kit) — manages and observes every capability the platform starter exposes.

> 📖 **Full usage guide — every screen, step by step:**
> **[devslab-kit.devslab.kr/guides/admin-console](https://devslab-kit.devslab.kr/guides/admin-console/)**
> (rendered, searchable, EN/KO — part of the devslab-kit docs site).

## What it covers

Not a thin CRUD form — a **full admin console** for everything `devslab-kit` ships:

| Area | Pages |
| --- | --- |
| Identity / Access | Users · Roles · Permissions · Groups (hierarchical members + role grants) · ABAC Policies (with dry-run tester) |
| Platform | Tenants · Menus (TreeTable with permission-gated nodes) · runtime Settings (`devslab.kit.*` properties read-only) · **Config Sync** (export / import config across environments — `merge`/`mirror`, dry-run diff) |
| Observability | Dashboard (KPI cards + recent audit events) · Audit Logs (filterable, lazy-paginated, JSON payload viewer) · Diagnostics (login tester, permission tester, menu-visibility tester) |

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Vue 3 + `<script setup>` + TypeScript |
| Build | Vite 8 |
| UI | PrimeVue 4 + Tailwind CSS 4 + `tailwindcss-primeui` + PrimeIcons |
| Theme | `Aura` preset, light + dark toggle (`.dark` selector) |
| State | Pinia |
| Routing | Vue Router (history mode, route-level lazy loading) |
| HTTP | axios + `Authorization: Bearer` interceptor + `401 → /login` redirect |
| Composables | `@vueuse/core` |
| Auth | JWT (HS256), issued by `devslab-kit-admin-api`, stored in `localStorage` |

## Local dev (3 terminals)

### Terminal 1 — Postgres + Redis (this repo)

```bash
npm run compose:up    # docker compose up -d  (postgres + redis)
```

Healthchecks ensure both are ready before you start the backend.

### Terminal 2 — devslab-kit sample backend (sibling repo)

```bash
# inside the devslab-kit checkout
./gradlew :devslab-kit-sample-app:bootRun
```

Backend listens on `http://localhost:8080` and connects to the Postgres / Redis containers above. Flyway runs V1..V10 on first boot.

### Terminal 3 — Vite dev (this repo)

```bash
npm install           # first time only
npm run dev
```

Dev server starts at `http://localhost:5173`. Vite proxies `/admin/api/**` → `http://localhost:8080`, so the UI talks to a locally-running `devslab-kit-sample-app` (or any consumer of `devslab-kit-spring-boot-starter`) with **no CORS dance**.

## Useful npm scripts

```bash
npm run dev               # vite dev server
npm run build             # type-check + production bundle
npm run preview           # preview the production bundle locally
npm run compose:up        # docker compose up -d
npm run compose:down      # docker compose down (keeps the postgres volume)
npm run compose:logs      # follow logs from postgres/redis
npm run test:e2e          # Playwright smoke tests (build + preview underneath)
npm run test:e2e:install  # CI bootstrap — download the Chromium browser
```

Override the API base at build time:

```bash
VITE_ADMIN_API_BASE_URL=https://your.api.example.com/admin/api/v1 npm run build
```

## Project layout

```
src/
├─ api/           ← axios client + per-resource wrappers
├─ stores/        ← Pinia (auth, ui)
├─ router/        ← Vue Router + nav guards
├─ layout/        ← AppLayout (sidebar + header + theme toggle + sign-out)
├─ views/         ← page components (one per admin surface)
├─ i18n/          ← vue-i18n setup + ko/en message bundles
├─ App.vue
├─ main.ts
└─ style.css      ← Tailwind + tailwindcss-primeui + PrimeIcons
docker-compose.yml ← postgres + redis + admin-ui for local dev / E2E
e2e/              ← Playwright smoke tests (login + dashboard + i18n toggle)
```

## Container build

Multi-stage Dockerfile (`node:24-alpine` to build, `nginx:1.27-alpine` to serve):

```bash
docker build -t devslab-kit-admin-ui .
docker run --rm -p 8081:80 devslab-kit-admin-ui
# → http://localhost:8081 (serves the SPA + reverse-proxies /admin/api/* to host `admin-api:8080`)
```

The bundled `nginx.conf` does three things worth knowing:

1. SPA fallback (`try_files $uri $uri/ /index.html`) so Vue Router owns client-side routing.
2. Long-immutable cache headers on `/assets/` (Vite hashes the filenames).
3. Reverse-proxy on `/admin/api/*` → `http://admin-api:8080`, so the browser never sees a CORS preflight in production.

## Local stack (docker-compose)

`docker-compose.yml` boots postgres + redis (the sample-app's backing services) and the admin UI container. Bring the `devslab-kit-sample-app` up separately, pointing it at the published ports.

```bash
docker compose up --build
# → admin UI: http://localhost:8081
# → postgres: localhost:5432   (devslab / devslab / devslab_kit)
# → redis:    localhost:6379
```

## CI

`.github/workflows/ci.yml` runs on push/PR to `main`:

1. `npm ci`
2. `npm run build` (vue-tsc type-check + Vite production build)
3. Upload `dist/` as a build artifact
4. Playwright smoke (5 tests, Chromium, mocked `/admin/api/**`)
5. Build the Docker image with Buildx + GitHub Actions cache (no push)

## License

[Apache License 2.0](LICENSE)
