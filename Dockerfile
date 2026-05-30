# syntax=docker/dockerfile:1.7

# ---------- build stage ----------
FROM node:24-alpine AS build
WORKDIR /app

# Install deps first for better layer caching
COPY package.json package-lock.json ./
RUN npm ci

# Build the SPA
COPY . .
ARG VITE_ADMIN_API_BASE_URL=/admin/api/v1
ENV VITE_ADMIN_API_BASE_URL=${VITE_ADMIN_API_BASE_URL}
RUN npm run build

# ---------- runtime stage ----------
FROM nginx:1.27-alpine AS runtime

# Custom config: SPA fallback + /admin/api/* proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Built assets
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz || exit 1
