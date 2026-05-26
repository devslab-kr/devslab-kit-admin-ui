# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Vue 3 + Vite + TypeScript scaffold via `npm create vite`.
- PrimeVue 4 (Aura preset) + Tailwind CSS 4 + `tailwindcss-primeui` + PrimeIcons setup.
- Pinia stores: `auth` (token + current user in `localStorage`) and `ui` (light/dark theme toggle).
- Vue Router with route-level lazy loading and nav guards (redirect to `/login` when unauthenticated).
- axios client with `VITE_ADMIN_API_BASE_URL` env, Bearer interceptor, and 401 redirect.
- `authApi.login` wrapper targeting `POST /admin/api/v1/auth/login` (endpoint shipped in matching backend PR).
- `LoginView`, `AppLayout` (sidebar + header + dark/light toggle + sign-out), `DashboardView` (placeholder KPI cards), per-resource placeholder views.
- Bilingual `README` / `README.ko.md`, Apache-2.0 `LICENSE`, this `CHANGELOG`.
- Vite dev proxy `/admin/api → http://localhost:8080`.

### Notes

- Real CRUD pages (Users / Roles / Permissions / Groups / Menus / Audit Logs / Tenants /
  Policies / Settings / Diagnostics) land in subsequent PRs.
- i18n (ko/en via `vue-i18n`), GitHub Actions CI, `Dockerfile` + `nginx.conf` land in Phase D.
- Login flow currently expects `LoginResponse { token, user }` from the backend, which the
  `devslab-kit-admin-api` is in the process of adding.
