# devslab-kit-admin-ui

[English README](README.md)

[devslab-kr/devslab-kit](https://github.com/devslab-kr/devslab-kit) 의 Vue 3 admin console — 플랫폼 스타터가 노출하는 모든 기능을 관리하고 모니터링한다.

## 다루는 범위

단순 CRUD 폼이 아니라 `devslab-kit` 이 제공하는 **모든 기능**을 다루는 **full admin console**:

| 영역 | 페이지 |
| --- | --- |
| Identity / Access | Users · Roles · Permissions · Groups (계층 멤버 + 역할 부여) · ABAC Policies (dry-run tester 포함) |
| Platform | Tenants · Menus (권한 기반 노드를 가진 TreeTable) · 런타임 Settings (`devslab.kit.*` properties read-only) · **Config Sync** (환경 간 설정 export / import — `merge`/`mirror`, dry-run diff) |
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

backend 는 `http://localhost:8080` 에서 떠서 위 Postgres / Redis 에 붙는다. Flyway 가 V1..V10 첫 부팅 시 적용.

### Terminal 3 — Vite dev (이 repo)

```bash
npm install           # 첫 회만
npm run dev
```

dev 서버는 `http://localhost:5173` 에서 뜨고, `/admin/api/**` 는 `http://localhost:8080` 로 proxy 한다. 로컬에 떠 있는 `devslab-kit-sample-app` (또는 `devslab-kit-spring-boot-starter` 를 쓰는 다른 consumer) 가 자동으로 잡힌다 — **CORS 안 건드린다**.

## 유용한 npm 스크립트

```bash
npm run dev               # vite dev 서버
npm run build             # 타입 체크 + 프로덕션 번들
npm run preview           # 프로덕션 번들 로컬 미리보기
npm run compose:up        # docker compose up -d
npm run compose:down      # docker compose down (postgres volume 유지)
npm run compose:logs      # postgres/redis 로그 팔로우
npm run test:e2e          # Playwright smoke 테스트 (build + preview 위에서 실행)
npm run test:e2e:install  # CI 부트스트랩 — Chromium 브라우저 다운로드
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
├─ layout/        ← AppLayout (sidebar + header + 테마 토글 + 로그아웃)
├─ views/         ← 페이지 컴포넌트 (admin surface 당 1개)
├─ i18n/          ← vue-i18n setup + ko/en 메시지 번들
├─ App.vue
├─ main.ts
└─ style.css      ← Tailwind + tailwindcss-primeui + PrimeIcons
docker-compose.yml ← 로컬 개발 / E2E 용 postgres + redis + admin-ui
e2e/              ← Playwright smoke 테스트 (login + dashboard + i18n 토글)
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
4. Playwright smoke 5 테스트 (Chromium, mock 된 `/admin/api/**`)
5. Buildx + GitHub Actions cache 로 Docker 이미지 빌드 (push 는 안 함)

## 라이선스

[Apache License 2.0](LICENSE)
