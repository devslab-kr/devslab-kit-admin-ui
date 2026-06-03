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
}

export interface ImportSection {
  created: string[]
  updated: string[]
}

export interface ImportResult {
  dryRun: boolean
  mode: string
  permissions: ImportSection
  roles: ImportSection
  menus: ImportSection
}

const base = '/config'

export const configSyncApi = {
  export(tenantId: string) {
    return client.get<ConfigBundle>(`${base}/export`, { params: { tenantId } }).then((r) => r.data)
  },
  // `import` is awkward as a method name; the backend endpoint is POST /config/import.
  apply(bundle: ConfigBundle, dryRun: boolean, mode = 'merge') {
    return client
      .post<ImportResult>(`${base}/import`, bundle, { params: { mode, dryRun } })
      .then((r) => r.data)
  },
}
