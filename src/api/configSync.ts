import { client } from './client'

export interface ConfigBundle {
  version: number
  tenantId: string
  permissions: Array<{ code: string; description: string | null }>
  roles: Array<{ code: string; name: string; permissionCodes: string[] }>
  menus: Array<{
    code: string
    parentCode: string | null
    label: string
    path: string | null
    icon: string | null
    requiredPermissionCode: string | null
    displayOrder: number
  }>
  // Present only when exported with includeUsers=true. Never carries a password.
  users?: Array<{ loginId: string; email: string | null; status: string; roleCodes: string[] }>
}

export interface ImportSection {
  created: string[]
  updated: string[]
  deleted: string[]
  skipped: string[]
}

export interface ImportResult {
  dryRun: boolean
  mode: string
  permissions: ImportSection
  roles: ImportSection
  menus: ImportSection
  users: ImportSection
}

const base = '/config'

export const configSyncApi = {
  export(tenantId: string, includeUsers = false) {
    return client
      .get<ConfigBundle>(`${base}/export`, { params: { tenantId, includeUsers } })
      .then((r) => r.data)
  },
  // `import` is awkward as a method name; the backend endpoint is POST /config/import.
  apply(bundle: ConfigBundle, dryRun: boolean, mode = 'merge', includeUsers = false) {
    return client
      .post<ImportResult>(`${base}/import`, bundle, { params: { mode, dryRun, includeUsers } })
      .then((r) => r.data)
  },
}
