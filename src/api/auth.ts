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

export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
}

export const authApi = {
  login(req: LoginRequest) {
    return client.post<LoginResponse>('/auth/login', req).then((r) => r.data)
  },
  // Self-service change. On success the backend clears the must-change flag and
  // returns a fresh token + user (now mustChangePassword=false), so the caller
  // can swap the session in place without a re-login round-trip.
  changePassword(req: ChangePasswordRequest) {
    return client.post<LoginResponse>('/auth/change-password', req).then((r) => r.data)
  },
}
