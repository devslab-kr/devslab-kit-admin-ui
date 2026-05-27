# devslab-kit-admin-ui

[한국어 README](README.ko.md)

Vue 3 admin console for [devslab-kr/devslab-kit](https://github.com/devslab-kr/devslab-kit) — manage and monitor every feature the platform starter exposes.

## Status

> **Scaffold + infra stage.** Login / Layout / placeholders + Docker Compose for Postgres/Redis are in place. CRUD pages, real backend integration, Playwright E2E, i18n, and packaging land in subsequent PRs.

## Goals

This is not just a CRUD UI on top of `devslab-kit-admin-api`. It is intended as the **full admin console** for everything the kit exposes:

- Identity / Access — Users · Roles · Permissions · Groups (incl. hierarchy) · ABAC Policies
- Platform — Tenants · Menus · runtime Settings (`devslab.kit.*` properties)
- Observability — Dashboard (KPIs + custom metrics) · Audit Logs · Diagnostics
  (login tester, permission tester, menu visibility tester) · Migration status
- Docs — embedded OpenAPI / Swagger UI (when backend ships springdoc-compatible release)

## Tech stack

| Layer | Choice |
| ----- | ------ |
| Framework | Vue 3 + `<script setup>` + TypeScript |
| Build | Vite |
| UI library | PrimeVue 4 + Tailwind CSS 4 + `tailwindcss-primeui` |
| Theme | Aura preset, light + dark with toggle |
| State | Pinia |
| Routing | Vue Router (history mode, route-level lazy loading) |
| HTTP | axios with `Authorization: Bearer` interceptor and 401 → `/login` redirect |
| Composables | `@vueuse/core` |
| Auth | JWT (HS256) issued by `devslab-kit-admin-api`, stored in `localStorage` |

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

Backend listens on `http://localhost:8080` and connects to the Postgres / Redis containers above. Flyway runs V1..V7 on first boot.

### Terminal 3 — Vite dev (this repo)

```bash
npm install           # first time only
npm run dev
```

Dev server: `http://localhost:5173`. Vite proxies `/admin/api/**` → `http://localhost:8080`, so the UI talks to the backend without CORS.

## Useful npm scripts

```bash
npm run dev           # vite dev server
npm run build         # type-check + production bundle
npm run preview       # preview the production bundle locally
npm run compose:up    # docker compose up -d
npm run compose:down  # docker compose down (keeps the postgres volume)
npm run compose:logs  # follow logs from postgres/redis
```

`VITE_ADMIN_API_BASE_URL` overrides the API base URL at build time:

```bash
VITE_ADMIN_API_BASE_URL=https://your.api.example.com/admin/api/v1 npm run build
```

## Project layout

```
src/
├─ api/           ← axios client + per-resource wrappers
├─ stores/        ← Pinia stores (auth, ui)
├─ router/        ← Vue Router config + nav guards
├─ layout/        ← AppLayout (sidebar + header)
├─ views/         ← page-level components
├─ App.vue
├─ main.ts
└─ style.css      ← Tailwind + PrimeVue + PrimeIcons
docker-compose.yml ← postgres + redis for local dev / E2E
```

## Deploy

Static SPA → nginx (`Dockerfile` + `nginx.conf` land in Phase D).

## License

[Apache License 2.0](LICENSE)
