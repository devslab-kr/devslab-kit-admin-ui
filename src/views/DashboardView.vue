<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Card from 'primevue/card'
import Skeleton from 'primevue/skeleton'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth'
import { usersApi } from '@/api/users'
import { tenantsApi } from '@/api/tenants'
import { auditLogsApi, type AuditLog } from '@/api/auditLogs'

const auth = useAuthStore()
const toast = useToast()

const userCount = ref<number | null>(null)
const tenantCount = ref<number | null>(null)
const recentEvents = ref<AuditLog[] | null>(null)
const loading = ref(false)

async function refresh() {
  loading.value = true
  const tenantId = auth.user?.tenantId ?? 'default'
  const errors: string[] = []

  await Promise.all([
    usersApi
      .list(tenantId)
      .then((rows) => (userCount.value = rows.length))
      .catch(() => errors.push('users')),
    tenantsApi
      .list()
      .then((rows) => (tenantCount.value = rows.length))
      .catch(() => errors.push('tenants')),
    auditLogsApi
      .search({ tenantId, page: 0, size: 5 })
      .then((page) => (recentEvents.value = page.content))
      .catch(() => errors.push('audit-logs')),
  ])

  loading.value = false

  if (errors.length > 0) {
    toast.add({
      severity: 'warn',
      summary: 'Some widgets failed to load',
      detail: `Affected: ${errors.join(', ')}`,
      life: 4000,
    })
  }
}

onMounted(refresh)
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold">Dashboard</h1>
      <Button icon="pi pi-refresh" severity="secondary" outlined :loading="loading" @click="refresh" />
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card data-testid="kpi-users">
        <template #content>
          <div class="flex items-center gap-3">
            <i class="pi pi-user text-2xl text-primary"></i>
            <div class="flex-1">
              <div class="text-sm text-surface-500 dark:text-surface-400">Users (current tenant)</div>
              <Skeleton v-if="loading && userCount === null" height="2rem" />
              <div v-else class="text-2xl font-semibold" data-testid="kpi-users-value">
                {{ userCount ?? '—' }}
              </div>
            </div>
          </div>
        </template>
      </Card>

      <Card data-testid="kpi-tenants">
        <template #content>
          <div class="flex items-center gap-3">
            <i class="pi pi-building text-2xl text-primary"></i>
            <div class="flex-1">
              <div class="text-sm text-surface-500 dark:text-surface-400">Tenants</div>
              <Skeleton v-if="loading && tenantCount === null" height="2rem" />
              <div v-else class="text-2xl font-semibold" data-testid="kpi-tenants-value">
                {{ tenantCount ?? '—' }}
              </div>
            </div>
          </div>
        </template>
      </Card>

      <Card data-testid="kpi-current-tenant">
        <template #content>
          <div class="flex items-center gap-3">
            <i class="pi pi-id-card text-2xl text-primary"></i>
            <div class="flex-1">
              <div class="text-sm text-surface-500 dark:text-surface-400">Current tenant</div>
              <div class="text-2xl font-semibold" data-testid="kpi-current-tenant-value">
                {{ auth.user?.tenantId ?? '—' }}
              </div>
            </div>
          </div>
        </template>
      </Card>

      <Card data-testid="kpi-signed-in">
        <template #content>
          <div class="flex items-center gap-3">
            <i class="pi pi-user-edit text-2xl text-primary"></i>
            <div class="flex-1">
              <div class="text-sm text-surface-500 dark:text-surface-400">Signed in as</div>
              <div class="text-2xl font-semibold" data-testid="kpi-signed-in-value">
                {{ auth.user?.loginId ?? '—' }}
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <Card data-testid="recent-events">
      <template #title>Recent audit events</template>
      <template #content>
        <div v-if="loading && recentEvents === null" class="flex flex-col gap-2">
          <Skeleton v-for="i in 5" :key="i" height="2rem" />
        </div>
        <div v-else-if="!recentEvents || recentEvents.length === 0" class="text-sm text-surface-500">
          No recent audit events.
        </div>
        <ul v-else class="divide-y divide-surface-200 dark:divide-surface-700">
          <li v-for="evt in recentEvents" :key="evt.id" class="py-2 flex items-center gap-3 text-sm">
            <Tag
              :value="evt.outcome"
              :severity="evt.outcome === 'SUCCESS' ? 'success' : 'danger'"
              style="min-width: 4.5rem; justify-content: center"
            />
            <span class="font-medium">{{ evt.action }}</span>
            <span class="text-surface-500">
              {{ evt.actorLogin ?? '—' }} → {{ evt.targetType ?? '—' }}/{{ evt.targetId ?? '—' }}
            </span>
            <span class="ml-auto text-xs text-surface-400">
              {{ new Date(evt.occurredAt).toLocaleString() }}
            </span>
          </li>
        </ul>
      </template>
    </Card>
  </div>
</template>
