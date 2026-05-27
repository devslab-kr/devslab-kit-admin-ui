import { client } from './client'

export interface Permission {
  id: string
  code: string
  description: string | null
  createdAt: string
}

export interface CreatePermissionRequest {
  code: string
  description?: string
}

const base = '/permissions'

export const permissionsApi = {
  list() {
    return client.get<Permission[]>(base).then((r) => r.data)
  },
  get(id: string) {
    return client.get<Permission>(`${base}/${id}`).then((r) => r.data)
  },
  create(req: CreatePermissionRequest) {
    return client.post<Permission>(base, req).then((r) => r.data)
  },
  updateDescription(id: string, description: string) {
    return client.put<void>(`${base}/${id}`, { description }).then((r) => r.data)
  },
  remove(id: string) {
    return client.delete<void>(`${base}/${id}`).then((r) => r.data)
  },
}
