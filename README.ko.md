# devslab-kit-admin-ui

[English README](README.md)

[devslab-kr/devslab-kit](https://github.com/devslab-kr/devslab-kit) 의 Vue 3 admin console — 플랫폼 스타터가 노출하는 모든 기능을 관리하고 모니터링한다.

## 상태

> **Scaffold 단계.** Login / Layout / placeholders 까지만. CRUD 페이지, 실제 백엔드 연동
> (login endpoint, tenant/policy/settings/diagnostics endpoints), i18n, 패키징은
> 후속 PR 들로.

## 목표

단순 CRUD UI 가 아니라 kit 가 노출하는 **모든 기능**을 다루는 **full admin console**.

- Identity / Access — Users · Roles · Permissions · Groups (계층 포함) · ABAC Policies
- Platform — Tenants · Menus · 런타임 Settings (`devslab.kit.*` properties)
- Observability — Dashboard (KPI + custom metrics) · Audit Logs · Diagnostics
  (로그인 tester, 권한 tester, 메뉴 가시성 tester) · 마이그레이션 상태
- Docs — OpenAPI / Swagger UI 임베드

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

## 실행

```bash
npm install
npm run dev
```

dev 서버는 `http://localhost:5173` 에서 뜨고, `/admin/api/**` 는 `http://localhost:8080`
로 proxy 한다 (`devslab-kit-sample-app` 같은 consumer 가 로컬에서 떠 있어야 함, CORS 불필요).

빌드 시 API base URL 오버라이드:

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
```

## 배포

Static SPA → nginx (`Dockerfile` + `nginx.conf` 는 Phase D).

## 라이선스

[Apache License 2.0](LICENSE)
