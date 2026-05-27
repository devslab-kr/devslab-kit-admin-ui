# devslab-kit-admin-ui

[한국어 README](README.ko.md)

Vue 3 admin console for [devslab-kr/devslab-kit](https://github.com/devslab-kr/devslab-kit) — manages and observes every capability the platform starter exposes.

## What it covers

Not a thin CRUD form — a **full admin console** for everything `devslab-kit` ships:

| Area | Pages |
| --- | --- |
| Identity / Access | Users · Roles · Permissions · Groups (hierarchical members + role grants) · ABAC Policies (with dry-run tester) |
| Platform | Tenants · Menus (TreeTable with permission-gated nodes) · runtime Settings (`devslab.kit.*` properties read-only) |
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

## Run locally

```bash
npm install
npm run dev
```

The dev server starts at `http://localhost:5173`. Requests to `/admin/api/**` are proxied to `http://localhost:8080`, so a `devslab-kit-sample-app` (or any consumer of `devslab-kit-spring-boot-starter`) running locally is picked up with **no CORS dance**.

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
├─ App.vue
├─ main.ts
└─ style.css      ← Tailwind + tailwindcss-primeui + PrimeIcons
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
4. Build the Docker image with Buildx + GitHub Actions cache (no push)

## License

[Apache License 2.0](LICENSE)
