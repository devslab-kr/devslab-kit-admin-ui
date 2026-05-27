# devslab-kit-admin-ui

[English README](README.md)

[devslab-kr/devslab-kit](https://github.com/devslab-kr/devslab-kit) 의 Vue 3 admin console — 플랫폼 스타터가 노출하는 모든 기능을 관리하고 모니터링한다.

## 상태

> **Scaffold + infra 단계.** Login / Layout / placeholders + Postgres/Redis Docker Compose 까지. CRUD 페이지, 실제 백엔드 연동, Playwright E2E, i18n, 패키징은 후속 PR.

## 목표

단순 CRUD UI 가 아니라 kit 가 노출하는 **모든 기능**을 다루는 **full admin console**.

- Identity / Access — Users · Roles · Permissions · Groups (계층) · ABAC Policies
- Platform — Tenants · Menus · 런타임 Settings (`devslab.kit.*`)
- Observability — Dashboard (KPI + custom metrics) · Audit Logs · Diagnostics (login/permission/menu tester) · Migration 상태
- Docs — OpenAPI / Swagger UI 임베드 (백엔드가 SB4 호환 springdoc 도입 시)

## 기술 스택

| 계층 | 선택 |
| ----- | ------ |
| 프레임워크 | Vue 3 + `<script setup>` + TypeScript |
| 빌드 | Vite |
| UI 라이브러리 | PrimeVue 4 + Tailwind CSS 4 + `tailwindcss-primeui` |
| 테마 | Aura preset, light + dark toggle |
| 상태 | Pinia |
| 라우팅 | Vue Router (history mode, route-level lazy loading) |
| HTTP | axios + `Authorization: Bearer` interceptor + 401 → `/login` 리다이렉트 |
| Composables | `@vueuse/core` |
| 인증 | JWT (HS256) — `devslab-kit-admin-api` 발급, `localStorage` 저장 |

## 로컬 개발 (터미널 3 개)

### Terminal 1 — Postgres + Redis (이 repo)

```bash
npm run compose:up    # docker compose up -d (postgres + redis)
```

healthcheck 가 ready 될 때까지 기다린 다음 backend 실행.

### Terminal 2 — devslab-kit 샘플 백엔드 (sibling repo)

```bash
# devslab-kit checkout 안에서
./gradlew :devslab-kit-sample-app:bootRun
```

backend 는 `http://localhost:8080` 에서 떠서 위 Postgres / Redis 에 붙는다. Flyway 가 V1..V7 첫 부팅 시 적용.

### Terminal 3 — Vite dev (이 repo)

```bash
npm install           # 첫 회만
npm run dev
```

dev 서버: `http://localhost:5173`. Vite 가 `/admin/api/**` → `http://localhost:8080` proxy 하므로 UI 는 CORS 없이 backend 호출.

## 유용한 npm 스크립트

```bash
npm run dev           # vite dev 서버
npm run build         # 타입 체크 + 프로덕션 번들
npm run preview       # 프로덕션 번들 로컬 미리보기
npm run compose:up    # docker compose up -d
npm run compose:down  # docker compose down (postgres volume 유지)
npm run compose:logs  # postgres/redis 로그 팔로우
```

빌드 시 `VITE_ADMIN_API_BASE_URL` 로 API base URL 오버라이드:

```bash
VITE_ADMIN_API_BASE_URL=https://your.api.example.com/admin/api/v1 npm run build
```

## 프로젝트 구조

```
src/
├─ api/           ← axios client + 리소스별 wrapper
├─ stores/        ← Pinia (auth, ui)
├─ router/        ← Vue Router + nav guard
├─ layout/        ← AppLayout (sidebar + header)
├─ views/         ← 페이지 컴포넌트
├─ App.vue
├─ main.ts
└─ style.css      ← Tailwind + PrimeVue + PrimeIcons
docker-compose.yml ← 로컬 개발 / E2E 용 postgres + redis
```

## 배포

Static SPA → nginx (`Dockerfile` + `nginx.conf` 는 Phase D).

## 라이선스

[Apache License 2.0](LICENSE)
