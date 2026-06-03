import { client } from './client'

export interface AuditLog {
  id: string
  tenantId: string | null
  actorId: string | null
  actorLogin: string | null
  action: string
  targetType: string | null
  targetId: string | null
  outcome: 'SUCCESS' | 'FAILURE'
  ip: string | null
  userAgent: string | null
  payload: Record<string, unknown> | null
  occurredAt: string
}

export interface AuditLogQuery {
  tenantId?: string
  actorLogin?: string
  action?: string
  targetType?: string
  outcome?: 'SUCCESS' | 'FAILURE'
  from?: string
  to?: string
  page?: number
  size?: number
}

export interface AuditLogPage {
  content: AuditLog[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

const base = '/audit-logs'

// Spring Data can serialize a Page either "flat" (top-level totalElements — legacy)
// or "via DTO" (a nested `page: { totalElements, ... }` object — newer default).
// Normalize both so the table's pagination works regardless of the backend's mode.
type RawPage = Partial<AuditLogPage> & {
  page?: { totalElements?: number; totalPages?: number; number?: number; size?: number }
}

export const auditLogsApi = {
  search(query: AuditLogQuery): Promise<AuditLogPage> {
    return client.get<RawPage>(base, { params: query }).then((r) => {
      const d = r.data
      const meta = d.page ?? {}
      return {
        content: d.content ?? [],
        totalElements: d.totalElements ?? meta.totalElements ?? (d.content?.length ?? 0),
        totalPages: d.totalPages ?? meta.totalPages ?? 1,
        number: d.number ?? meta.number ?? (query.page ?? 0),
        size: d.size ?? meta.size ?? (query.size ?? 25),
      }
    })
  },
  get(id: string) {
    return client.get<AuditLog>(`${base}/${id}`).then((r) => r.data)
  },
}
