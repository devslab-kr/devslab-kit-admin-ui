import { client } from './client'

export interface Tenant {
  id: string
  name: string
  status: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED'
  createdAt: string
}

export interface CreateTenantRequest {
  id: string
  name: string
}

const base = '/tenants'

export const tenantsApi = {
  list() {
    return client.get<Tenant[]>(base).then((r) => r.data)
  },
  get(id: string) {
    return client.get<Tenant>(`${base}/${id}`).then((r) => r.data)
  },
  create(req: CreateTenantRequest) {
    return client.post<Tenant>(base, req).then((r) => r.data)
  },
  rename(id: string, name: string) {
    return client.put<void>(`${base}/${id}`, { name }).then((r) => r.data)
  },
  updateStatus(id: string, status: Tenant['status']) {
    return client.put<void>(`${base}/${id}/status`, { status }).then((r) => r.data)
  },
  remove(id: string) {
    return client.delete<void>(`${base}/${id}`).then((r) => r.data)
  },
}
