import { client } from './client'

export interface AdminSettings {
  jwt: {
    issuer: string
    ttlSeconds: number
    secretMasked: string
  }
  tenant: {
    resolver: string
  }
  audit: {
    enabled: boolean
    asyncQueueCapacity: number
  }
  cache: {
    type: string
    ttlSeconds: number
    keyPrefix: string
  }
  identity: {
    lockoutThreshold: number
    lockoutDurationSeconds: number
  }
  raw: Record<string, string>
}

const base = '/settings'

export const settingsApi = {
  get() {
    return client.get<AdminSettings>(base).then((r) => r.data)
  },
}
