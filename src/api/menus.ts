import { client } from './client'

export interface MenuItem {
  id: { value: string }
  tenantId: { value: string }
  parentId: { value: string } | null
  code: string
  label: string
  path: string | null
  icon: string | null
  requiredPermission: string | null
  displayOrder: number
  children?: MenuItem[]
}

export interface CreateMenuRequest {
  tenantId: string
  parentId?: string | null
  code: string
  label: string
  path?: string
  icon?: string
  requiredPermission?: string
  displayOrder?: number
}

export interface UpdateMenuRequest {
  label?: string
  path?: string | null
  icon?: string | null
  requiredPermission?: string | null
  displayOrder?: number
}

const base = '/menus'

export const menusApi = {
  tree(tenantId: string) {
    return client.get<MenuItem[]>(`${base}/tree`, { params: { tenantId } }).then((r) => r.data)
  },
  list(tenantId: string) {
    return client.get<MenuItem[]>(base, { params: { tenantId } }).then((r) => r.data)
  },
  get(id: string) {
    return client.get<MenuItem>(`${base}/${id}`).then((r) => r.data)
  },
  create(req: CreateMenuRequest) {
    return client.post<MenuItem>(base, req).then((r) => r.data)
  },
  update(id: string, req: UpdateMenuRequest) {
    return client.put<void>(`${base}/${id}`, req).then((r) => r.data)
  },
  remove(id: string) {
    return client.delete<void>(`${base}/${id}`).then((r) => r.data)
  },
}
