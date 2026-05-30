import { client } from './client'

export interface Group {
  id: { value: string }
  tenantId: { value: string }
  code: string
  name: string
}

export interface CreateGroupRequest {
  tenantId: string
  code: string
  name: string
}

const base = '/groups'

export const groupsApi = {
  list(tenantId: string) {
    return client.get<Group[]>(base, { params: { tenantId } }).then((r) => r.data)
  },
  get(id: string) {
    return client.get<Group>(`${base}/${id}`).then((r) => r.data)
  },
  create(req: CreateGroupRequest) {
    return client.post<Group>(base, req).then((r) => r.data)
  },
  rename(id: string, name: string) {
    return client.put<void>(`${base}/${id}`, { name }).then((r) => r.data)
  },
  remove(id: string) {
    return client.delete<void>(`${base}/${id}`).then((r) => r.data)
  },
  members(id: string) {
    return client.get<{ value: string }[]>(`${base}/${id}/members`).then((r) => r.data)
  },
  addMember(groupId: string, userId: string) {
    return client.post<void>(`${base}/${groupId}/members/${userId}`).then((r) => r.data)
  },
  removeMember(groupId: string, userId: string) {
    return client.delete<void>(`${base}/${groupId}/members/${userId}`).then((r) => r.data)
  },
  roles(id: string) {
    return client.get<{ value: string }[]>(`${base}/${id}/roles`).then((r) => r.data)
  },
  grantRole(groupId: string, roleId: string) {
    return client.post<void>(`${base}/${groupId}/roles/${roleId}`).then((r) => r.data)
  },
  revokeRole(groupId: string, roleId: string) {
    return client.delete<void>(`${base}/${groupId}/roles/${roleId}`).then((r) => r.data)
  },
}
