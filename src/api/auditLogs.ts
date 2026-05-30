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

export const auditLogsApi = {
  search(query: AuditLogQuery) {
    return client.get<AuditLogPage>(base, { params: query }).then((r) => r.data)
  },
  get(id: string) {
    return client.get<AuditLog>(`${base}/${id}`).then((r) => r.data)
  },
}
