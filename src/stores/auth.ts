import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

const TOKEN_KEY = 'devslab-kit-admin-token'
const USER_KEY = 'devslab-kit-admin-user'

export interface CurrentUser {
  id: string
  publicId: string
  tenantId: string
  loginId: string
  email?: string | null
  status: string
  roles?: string[]
  mustChangePassword?: boolean
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const userJson = localStorage.getItem(USER_KEY)
  const user = ref<CurrentUser | null>(userJson ? JSON.parse(userJson) : null)

  const isAuthenticated = computed(() => token.value !== null)
  const mustChangePassword = computed(() => user.value?.mustChangePassword === true)

  function setSession(newToken: string, newUser: CurrentUser) {
    token.value = newToken
    user.value = newUser
    localStorage.setItem(TOKEN_KEY, newToken)
    localStorage.setItem(USER_KEY, JSON.stringify(newUser))
  }

  function clear() {
    token.value = null
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  return { token, user, isAuthenticated, mustChangePassword, setSession, clear }
})
