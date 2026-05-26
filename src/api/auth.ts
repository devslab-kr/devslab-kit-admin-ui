import { client } from './client'
import type { CurrentUser } from '@/stores/auth'

export interface LoginRequest {
  tenantId: string
  loginId: string
  rawPassword: string
}

export interface LoginResponse {
  token: string
  user: CurrentUser
}

export const authApi = {
  login(req: LoginRequest) {
    return client.post<LoginResponse>('/auth/login', req).then((r) => r.data)
  },
}
