import { client } from './client'

export interface UserAccount {
  id: { value: string }
  publicId: { value: string }
  tenantId: { value: string }
  loginId: string
  email: string | null
  status: 'ACTIVE' | 'LOCKED' | 'DISABLED' | 'PENDING_VERIFICATION'
  locked: boolean
  providerType: string
}

export interface CreateUserRequest {
  tenantId: string
  loginId: string
  email?: string
  rawPassword: string
  providerType?: string
}

export interface UpdateUserStatusRequest {
  status: 'ACTIVE' | 'LOCKED' | 'DISABLED' | 'PENDING_VERIFICATION'
}

export interface ResetPasswordRequest {
  newRawPassword: string
}

const base = '/users'

export const usersApi = {
  list(tenantId: string) {
    return client.get<UserAccount[]>(base, { params: { tenantId } }).then((r) => r.data)
  },
  get(id: string) {
    return client.get<UserAccount>(`${base}/${id}`).then((r) => r.data)
  },
  create(req: CreateUserRequest) {
    return client.post<UserAccount>(base, req).then((r) => r.data)
  },
  lock(id: string) {
    return client.put<void>(`${base}/${id}/lock`).then((r) => r.data)
  },
  unlock(id: string) {
    return client.put<void>(`${base}/${id}/unlock`).then((r) => r.data)
  },
  updateStatus(id: string, req: UpdateUserStatusRequest) {
    return client.put<void>(`${base}/${id}/status`, req).then((r) => r.data)
  },
  resetPassword(id: string, req: ResetPasswordRequest) {
    return client.put<void>(`${base}/${id}/password`, req).then((r) => r.data)
  },
  remove(id: string) {
    return client.delete<void>(`${base}/${id}`).then((r) => r.data)
  },
  // Roles/groups assigned to a user (ids). Assign/revoke live on the role & group
  // resources (rolesApi.assignToUser / groupsApi.addMember). Kit 0.4.2+.
  roles(id: string) {
    return client.get<{ value: string }[]>(`${base}/${id}/roles`).then((r) => r.data)
  },
  groups(id: string) {
    return client.get<{ value: string }[]>(`${base}/${id}/groups`).then((r) => r.data)
  },
}
