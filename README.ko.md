# devslab-kit-admin-ui

[English README](README.md)

[devslab-kr/devslab-kit](https://github.com/devslab-kr/devslab-kit) 의 Vue 3 admin console — 플랫폼 스타터가 노출하는 모든 기능을 관리하고 모니터링한다.

## 다루는 범위

단순 CRUD 폼이 아니라 `devslab-kit` 이 제공하는 **모든 기능**을 다루는 **full admin console**:

| 영역 | 페이지 |
| --- | --- |
| Identity / Access | Users · Roles · Permissions · Groups (계층 멤버 + 역할 부여) · ABAC Policies (dry-run tester 포함) |
| Platform | Tenants · Menus (권한 기반 노드를 가진 TreeTable) · 런타임 Settings (`devslab.kit.*` properties read-only) |
| Observability | Dashboard (KPI 카드 + 최근 audit 이벤트) · Audit Logs (필터 + lazy paging + JSON payload viewer) · Diagnostics (로그인 tester, 권한 tester, menu-visibility tester) |

## 기술 스택

| 계층 | 선택 |
| --- | --- |
| 프레임워크 | Vue 3 + `<script setup>` + TypeScript |
| 빌드 | Vite 8 |
| UI | PrimeVue 4 + Tailwind CSS 4 + `tailwindcss-primeui` + PrimeIcons |
| 테마 | `Aura` preset, light + dark 토글 (`.dark` selector) |
| 상태 | Pinia |
| 라우팅 | Vue Router (history mode, route-level lazy loading) |
| HTTP | axios + `Authorization: Bearer` interceptor + `401 → /login` 리다이렉트 |
| Composables | `@vueuse/core` |
| 인증 | JWT (HS256) — `devslab-kit-admin-api` 발급, `localStorage` 저장 |

## 로컬 실행

```bash
npm install
npm run dev
```

dev 서버는 `http://localhost:5173` 에서 뜨고, `/admin/api/**` 는 `http://localhost:8080` 로 proxy 한다. 로컬에 떠 있는 `devslab-kit-sample-app` (또는 `devslab-kit-spring-boot-starter` 를 쓰는 다른 consumer) 가 자동으로 잡힌다 — **CORS 안 건드린다**.

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
├─ layout/        ← AppLayout (sidebar + header + 테마 토글 + 로그아웃)
├─ views/         ← 페이지 컴포넌트 (admin surface 당 1개)
├─ App.vue
├─ main.ts
└─ style.css      ← Tailwind + tailwindcss-primeui + PrimeIcons
```

## 컨테이너 빌드

멀티스테이지 Dockerfile (`node:24-alpine` 빌드, `nginx:1.27-alpine` 서빙):

```bash
docker build -t devslab-kit-admin-ui .
docker run --rm -p 8081:80 devslab-kit-admin-ui
# → http://localhost:8081 (SPA 서빙 + /admin/api/* 를 host `admin-api:8080` 로 reverse-proxy)
```

번들된 `nginx.conf` 가 하는 일:

1. SPA fallback (`try_files $uri $uri/ /index.html`) — Vue Router 가 client-side routing 담당.
2. `/assets/` 에 long-immutable cache (Vite 가 파일명에 hash 박음).
3. `/admin/api/*` → `http://admin-api:8080` reverse-proxy — production 에서 브라우저가 CORS preflight 안 보냄.

## 로컬 스택 (docker-compose)

`docker-compose.yml` 은 postgres + redis (sample-app 의 backing services) 와 admin UI 컨테이너를 띄운다. `devslab-kit-sample-app` 은 별도로 띄워서 published port 를 보게 한다.

```bash
docker compose up --build
# → admin UI: http://localhost:8081
# → postgres: localhost:5432   (devslab / devslab / devslab_kit)
# → redis:    localhost:6379
```

## CI

`.github/workflows/ci.yml` 은 `main` 으로의 push / PR 마다:

1. `npm ci`
2. `npm run build` (vue-tsc type-check + Vite production build)
3. `dist/` 를 build artifact 로 업로드
4. Buildx + GitHub Actions cache 로 Docker 이미지 빌드 (push 는 안 함)

## 라이선스

[Apache License 2.0](LICENSE)
