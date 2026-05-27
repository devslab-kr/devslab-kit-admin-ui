<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Message from 'primevue/message'
import { useToast } from 'primevue/usetoast'
import { settingsApi, type AdminSettings } from '@/api/settings'

const toast = useToast()

const data = ref<AdminSettings | null>(null)
const loading = ref(false)

async function reload() {
  loading.value = true
  try {
    data.value = await settingsApi.get()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Failed to load settings', detail: msg(e), life: 4000 })
  } finally {
    loading.value = false
  }
}

function rawRows() {
  if (!data.value?.raw) return []
  return Object.entries(data.value.raw).map(([key, value]) => ({ key, value }))
}

function msg(e: unknown): string {
  if (e && typeof e === 'object' && 'response' in e) {
    const r = (e as { response?: { data?: { message?: string } } }).response
    return r?.data?.message ?? String(e)
  }
  return String(e)
}

onMounted(reload)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold">Platform settings</h1>
      <Button icon="pi pi-refresh" severity="secondary" outlined :loading="loading" @click="reload" />
    </div>

    <Message severity="info" :closable="false">
      Read-only view of the live <code>DevslabKitProperties</code> + selected <code>devslab.*</code> environment
      values. To change a value, redeploy the backend with the new configuration.
    </Message>

    <div v-if="data" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <template #title>JWT</template>
        <template #content>
          <dl class="text-sm space-y-1">
            <div><dt class="inline font-medium">Issuer:</dt> <dd class="inline">{{ data.jwt.issuer }}</dd></div>
            <div><dt class="inline font-medium">TTL (seconds):</dt> <dd class="inline">{{ data.jwt.ttlSeconds }}</dd></div>
            <div>
              <dt class="inline font-medium">Secret:</dt>
              <dd class="inline"><code>{{ data.jwt.secretMasked }}</code></dd>
            </div>
          </dl>
        </template>
      </Card>

      <Card>
        <template #title>Tenant resolver</template>
        <template #content>
          <p class="text-sm"><code>{{ data.tenant.resolver }}</code></p>
        </template>
      </Card>

      <Card>
        <template #title>Identity</template>
        <template #content>
          <dl class="text-sm space-y-1">
            <div>
              <dt class="inline font-medium">Lockout threshold:</dt>
              <dd class="inline">{{ data.identity.lockoutThreshold }} attempts</dd>
            </div>
            <div>
              <dt class="inline font-medium">Lockout duration:</dt>
              <dd class="inline">{{ data.identity.lockoutDurationSeconds }} s</dd>
            </div>
          </dl>
        </template>
      </Card>

      <Card>
        <template #title>Audit</template>
        <template #content>
          <dl class="text-sm space-y-1">
            <div>
              <dt class="inline font-medium">Enabled:</dt>
              <dd class="inline">{{ data.audit.enabled ? 'yes' : 'no' }}</dd>
            </div>
            <div>
              <dt class="inline font-medium">Async queue capacity:</dt>
              <dd class="inline">{{ data.audit.asyncQueueCapacity }}</dd>
            </div>
          </dl>
        </template>
      </Card>

      <Card>
        <template #title>Menu</template>
        <template #content>
          <dl class="text-sm space-y-1">
            <div>
              <dt class="inline font-medium">Cache TTL (seconds):</dt>
              <dd class="inline">{{ data.menu.cacheTtlSeconds }}</dd>
            </div>
          </dl>
        </template>
      </Card>

      <Card class="lg:col-span-2">
        <template #title>Raw devslab.* properties</template>
        <template #content>
          <DataTable :value="rawRows()" striped-rows paginator :rows="20" data-key="key">
            <Column field="key" header="Key" sortable style="width: 24rem" />
            <Column field="value" header="Value">
              <template #body="{ data: row }">
                <code class="text-xs">{{ row.value }}</code>
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>
    </div>
  </div>
</template>
