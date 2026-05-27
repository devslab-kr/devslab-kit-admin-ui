import { client } from './client'

export interface Role {
  id: { value: string }
  code: string
  name: string
}

export interface CreateRoleRequest {
  tenantId: string
  code: string
  name: string
}

const base = '/roles'

export const rolesApi = {
  list(tenantId: string) {
    return client.get<Role[]>(base, { params: { tenantId } }).then((r) => r.data)
  },
  get(id: string) {
    return client.get<Role>(`${base}/${id}`).then((r) => r.data)
  },
  create(req: CreateRoleRequest) {
    return client.post<Role>(base, req).then((r) => r.data)
  },
  rename(id: string, name: string) {
    return client.put<void>(`${base}/${id}`, { name }).then((r) => r.data)
  },
  remove(id: string) {
    return client.delete<void>(`${base}/${id}`).then((r) => r.data)
  },
  permissions(id: string) {
    return client.get<{ value: string }[]>(`${base}/${id}/permissions`).then((r) => r.data)
  },
  grantPermission(roleId: string, permissionId: string) {
    return client.post<void>(`${base}/${roleId}/permissions/${permissionId}`).then((r) => r.data)
  },
  revokePermission(roleId: string, permissionId: string) {
    return client.delete<void>(`${base}/${roleId}/permissions/${permissionId}`).then((r) => r.data)
  },
  assignToUser(roleId: string, userId: string, tenantId: string) {
    return client
      .post<void>(`${base}/${roleId}/users/${userId}`, null, { params: { tenantId } })
      .then((r) => r.data)
  },
  revokeFromUser(roleId: string, userId: string) {
    return client.delete<void>(`${base}/${roleId}/users/${userId}`).then((r) => r.data)
  },
}
