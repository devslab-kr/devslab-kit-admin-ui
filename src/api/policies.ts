import { client } from './client'

export interface PolicyDescriptor {
  name: string
  description: string | null
}

export interface PolicyTestRequest {
  policyName: string
  subject: {
    userId: string
    tenantId?: string
    attributes?: Record<string, unknown>
  }
  action: string
  resource: {
    type: string
    id?: string
    attributes?: Record<string, unknown>
  }
  environment?: Record<string, unknown>
}

export interface PolicyTestResponse {
  effect: 'PERMIT' | 'DENY' | 'NOT_APPLICABLE'
  reason: string | null
  matchedRules: string[]
}

const base = '/policies'

export const policiesApi = {
  list() {
    return client.get<PolicyDescriptor[]>(base).then((r) => r.data)
  },
  test(req: PolicyTestRequest) {
    return client.post<PolicyTestResponse>(`${base}/test`, req).then((r) => r.data)
  },
}
