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
    if (error?.response?.status === 401) {
      const auth = useAuthStore()
      auth.clear()
      router.replace({ name: 'login' })
    }
    return Promise.reject(error)
  },
)
