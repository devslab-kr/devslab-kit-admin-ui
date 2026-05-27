<script setup lang="ts">
import { onMounted, ref } from 'vue'
import DataTable, { type DataTablePageEvent } from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Tag from 'primevue/tag'
import { useToast } from 'primevue/usetoast'
import { auditLogsApi, type AuditLog, type AuditLogQuery } from '@/api/auditLogs'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const toast = useToast()

const filter = ref<{
  tenantId: string
  actorLogin: string
  action: string
  targetType: string
  outcome: '' | 'SUCCESS' | 'FAILURE'
  range: [Date | null, Date | null] | null
}>({
  tenantId: auth.user?.tenantId ?? 'default',
  actorLogin: '',
  action: '',
  targetType: '',
  outcome: '',
  range: null,
})

const outcomeOptions = [
  { label: 'Any', value: '' },
  { label: 'Success', value: 'SUCCESS' },
  { label: 'Failure', value: 'FAILURE' },
]

const rows = ref<AuditLog[]>([])
const totalRecords = ref(0)
const page = ref(0)
const size = ref(25)
const loading = ref(false)

const detailOpen = ref(false)
const detail = ref<AuditLog | null>(null)

function buildQuery(): AuditLogQuery {
  const q: AuditLogQuery = { page: page.value, size: size.value }
  if (filter.value.tenantId) q.tenantId = filter.value.tenantId
  if (filter.value.actorLogin) q.actorLogin = filter.value.actorLogin
  if (filter.value.action) q.action = filter.value.action
  if (filter.value.targetType) q.targetType = filter.value.targetType
  if (filter.value.outcome) q.outcome = filter.value.outcome
  if (filter.value.range?.[0]) q.from = filter.value.range[0].toISOString()
  if (filter.value.range?.[1]) q.to = filter.value.range[1].toISOString()
  return q
}

async function reload() {
  loading.value = true
  try {
    const result = await auditLogsApi.search(buildQuery())
    rows.value = result.content
    totalRecords.value = result.totalElements
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Failed to load audit logs', detail: msg(e), life: 4000 })
  } finally {
    loading.value = false
  }
}

function onPage(event: DataTablePageEvent) {
  page.value = event.page
  size.value = event.rows
  reload()
}

function openDetail(row: AuditLog) {
  detail.value = row
  detailOpen.value = true
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
      <h1 class="text-xl font-semibold">Audit logs</h1>
      <Button icon="pi pi-refresh" severity="secondary" outlined @click="reload" />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-6 gap-3 p-3 rounded-md border border-surface-200 dark:border-surface-700">
      <InputText v-model="filter.tenantId" placeholder="tenantId" />
      <InputText v-model="filter.actorLogin" placeholder="Actor login" />
      <InputText v-model="filter.action" placeholder="Action (e.g. user.login)" />
      <InputText v-model="filter.targetType" placeholder="Target type" />
      <Select
        v-model="filter.outcome"
        :options="outcomeOptions"
        option-label="label"
        option-value="value"
        placeholder="Outcome"
      />
      <DatePicker
        v-model="filter.range"
        selection-mode="range"
        :show-time="true"
        hour-format="24"
        placeholder="From — To"
      />
      <div class="md:col-span-6 flex justify-end">
        <Button icon="pi pi-search" label="Search" @click="page = 0; reload()" />
      </div>
    </div>

    <DataTable
      :value="rows"
      :loading="loading"
      lazy
      paginator
      :rows="size"
      :total-records="totalRecords"
      :rows-per-page-options="[25, 50, 100]"
      striped-rows
      data-key="id"
      @page="onPage"
    >
      <Column field="occurredAt" header="When" style="width: 14rem">
        <template #body="{ data }">
          {{ new Date(data.occurredAt).toLocaleString() }}
        </template>
      </Column>
      <Column field="action" header="Action" sortable />
      <Column field="actorLogin" header="Actor" />
      <Column field="targetType" header="Target type" />
      <Column field="targetId" header="Target id" />
      <Column header="Outcome" style="width: 7rem">
        <template #body="{ data }">
          <Tag :value="data.outcome" :severity="data.outcome === 'SUCCESS' ? 'success' : 'danger'" />
        </template>
      </Column>
      <Column field="ip" header="IP" />
      <Column header="" style="width: 5rem">
        <template #body="{ data }">
          <Button icon="pi pi-eye" text rounded aria-label="Inspect" @click="openDetail(data)" />
        </template>
      </Column>
    </DataTable>

    <Dialog v-model:visible="detailOpen" header="Audit log detail" modal :style="{ width: '36rem' }">
      <div v-if="detail" class="flex flex-col gap-2 text-sm">
        <div><strong>When:</strong> {{ new Date(detail.occurredAt).toLocaleString() }}</div>
        <div><strong>Action:</strong> {{ detail.action }}</div>
        <div><strong>Outcome:</strong> {{ detail.outcome }}</div>
        <div><strong>Tenant:</strong> {{ detail.tenantId || '—' }}</div>
        <div><strong>Actor:</strong> {{ detail.actorLogin || '—' }} ({{ detail.actorId || '—' }})</div>
        <div><strong>Target:</strong> {{ detail.targetType || '—' }} / {{ detail.targetId || '—' }}</div>
        <div><strong>IP:</strong> {{ detail.ip || '—' }}</div>
        <div><strong>User-Agent:</strong> {{ detail.userAgent || '—' }}</div>
        <div class="mt-2">
          <strong>Payload:</strong>
          <pre class="mt-1 p-2 rounded bg-surface-100 dark:bg-surface-800 overflow-auto text-xs">{{
            detail.payload ? JSON.stringify(detail.payload, null, 2) : '(empty)'
          }}</pre>
        </div>
      </div>
      <template #footer>
        <Button label="Close" text @click="detailOpen = false" />
      </template>
    </Dialog>
  </div>
</template>
