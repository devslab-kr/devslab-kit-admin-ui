import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [vue(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: {
        '/admin/api': {
          // 기본값은 로컬 백엔드(중립). 이 repo 는 특정 백엔드(bookrecord 등)를 알지 않는다.
          // 다른 백엔드를 가리키려면 .env.local 에 VITE_PROXY_TARGET 을 설정하라.
          //   예) VITE_PROXY_TARGET=http://host.docker.internal:8080
          target: env.VITE_PROXY_TARGET || 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
  }
})
