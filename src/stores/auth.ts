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

/** Epoch ms of the JWT's `exp`, or null if absent/unparseable. */
function tokenExpiryMs(token: string | null): number | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length < 2) return null
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const userJson = localStorage.getItem(USER_KEY)
  const user = ref<CurrentUser | null>(userJson ? JSON.parse(userJson) : null)

  const isAuthenticated = computed(() => token.value !== null)
  const mustChangePassword = computed(() => user.value?.mustChangePassword === true)

  // A function (not computed) so it re-reads the clock on every call — used by the
  // router guard and the axios interceptor to detect an expired session and bounce
  // the user to login instead of letting expired requests fail silently.
  function isExpired(): boolean {
    const exp = tokenExpiryMs(token.value)
    return exp != null && exp <= Date.now()
  }

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

  return { token, user, isAuthenticated, isExpired, mustChangePassword, setSession, clear }
})
