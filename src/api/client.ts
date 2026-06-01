import axios, { type AxiosInstance } from 'axios'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

const baseURL = (import.meta.env.VITE_ADMIN_API_BASE_URL as string | undefined) ?? '/admin/api/v1'

export const client: AxiosInstance = axios.create({
  baseURL,
  timeout: 30000,
})

client.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.token) {
    config.headers.set('Authorization', `Bearer ${auth.token}`)
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    // The kit's admin API returns RFC 7807 ProblemDetail (application/problem+json):
    // the human-readable message lives in `detail` (falling back to `title`). Older
    // builds put it in `message`. Normalize all of these onto `data.message` so every
    // view can keep reading `error.response.data.message` regardless of the shape.
    const data = error?.response?.data
    if (data && typeof data === 'object' && data.message == null) {
      data.message = data.detail ?? data.title ?? undefined
    }

    // A 401 on an /auth/ endpoint is an expected, in-form outcome — bad login
    // credentials, or a wrong *current* password on the change-password screen.
    // The calling view shows the error inline; auto-logging-out here would yank
    // the user off that screen (and clobber a half-finished rotation), so skip
    // the global handler for those and let the caller deal with it.
    const url = error?.config?.url ?? ''
    const isAuthEndpoint = typeof url === 'string' && url.includes('/auth/')
    if (error?.response?.status === 401 && !isAuthEndpoint) {
      const auth = useAuthStore()
      auth.clear()
      router.replace({ name: 'login' })
    }
    return Promise.reject(error)
  },
)
