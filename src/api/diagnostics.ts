import { client } from './client'

export interface LoginTestRequest {
  tenantId: string
  loginId: string
  rawPassword: string
}

export interface LoginTestResponse {
  success: boolean
  userId: string | null
  status: string | null
  failureReason: string | null
}

export interface PermissionCheckRequest {
  userId: string
  permissionCode: string
  tenantId?: string
}

export interface PermissionCheckResponse {
  hasPermission: boolean
  matchedVia: string[]
}

export interface MenuVisibilityResponse {
  items: Array<{
    id: string
    code: string
    label: string
    visible: boolean
    requiredPermission: string | null
    children: MenuVisibilityResponse['items']
  }>
}

const base = '/diagnostics'

export const diagnosticsApi = {
  loginTest(req: LoginTestRequest) {
    return client.post<LoginTestResponse>(`${base}/login-test`, req).then((r) => r.data)
  },
  permissionCheck(req: PermissionCheckRequest) {
    return client.post<PermissionCheckResponse>(`${base}/permission-check`, req).then((r) => r.data)
  },
  menuVisibility(userId: string, tenantId: string) {
    return client
      .get<MenuVisibilityResponse>(`${base}/menu-visibility`, { params: { userId, tenantId } })
      .then((r) => r.data)
  },
}
