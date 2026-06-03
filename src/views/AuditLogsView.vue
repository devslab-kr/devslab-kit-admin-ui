<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import DataTable, { type DataTablePageEvent, type DataTableRowClickEvent } from 'primevue/datatable'
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
const { t } = useI18n()

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

const outcomeOptions = computed(() => [
  { label: t('auditLogs.outcome.any'), value: '' },
  { label: t('auditLogs.outcome.success'), value: 'SUCCESS' },
  { label: t('auditLogs.outcome.failure'), value: 'FAILURE' },
])

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
    toast.add({ severity: 'error', summary: t('auditLogs.toasts.loadFailed'), detail: msg(e), life: 4000 })
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

function onRowClick(event: DataTableRowClickEvent) {
  openDetail(event.data as AuditLog)
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
      <div class="flex items-baseline gap-3">
        <h1 class="text-2xl font-semibold">{{ t('auditLogs.title') }}</h1>
        <span class="text-sm text-surface-500">{{ totalRecords.toLocaleString() }}</span>
      </div>
      <Button icon="pi pi-refresh" severity="secondary" outlined v-tooltip.top="t('common.ariaRefresh')" :aria-label="t('common.ariaRefresh')" @click="reload" />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-6 gap-3 p-3 rounded-md border border-surface-200 dark:border-surface-700">
      <InputText v-model="filter.actorLogin" :placeholder="t('auditLogs.filters.actorLogin')" />
      <InputText v-model="filter.action" :placeholder="t('auditLogs.filters.action')" />
      <InputText v-model="filter.targetType" :placeholder="t('auditLogs.filters.targetType')" />
      <Select
        v-model="filter.outcome"
        :options="outcomeOptions"
        option-label="label"
        option-value="value"
        :placeholder="t('auditLogs.filters.outcomeAny')"
      />
      <DatePicker
        v-model="filter.range"
        selection-mode="range"
        :show-time="true"
        hour-format="24"
        :placeholder="t('auditLogs.filters.from')"
      />
      <div class="md:col-span-6 flex justify-end">
        <Button icon="pi pi-search" :label="t('auditLogs.search')" @click="page = 0; reload()" />
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
      show-gridlines
      size="large"
      scrollable
      scroll-height="62vh"
      row-hover
      data-key="id"
      class="audit-table text-base"
      @page="onPage"
      @row-click="onRowClick"
    >
      <Column field="occurredAt" :header="t('auditLogs.columns.when')" style="width: 14rem">
        <template #body="{ data }">
          {{ new Date(data.occurredAt).toLocaleString() }}
        </template>
      </Column>
      <Column field="action" :header="t('auditLogs.columns.action')" sortable />
      <Column field="actorLogin" :header="t('auditLogs.columns.actor')" />
      <Column field="targetType" :header="t('auditLogs.columns.targetType')" />
      <Column field="targetId" :header="t('auditLogs.columns.targetId')" />
      <Column :header="t('auditLogs.columns.outcome')" style="width: 7rem">
        <template #body="{ data }">
          <Tag :value="data.outcome" :severity="data.outcome === 'SUCCESS' ? 'success' : 'danger'" />
        </template>
      </Column>
      <Column field="ip" :header="t('auditLogs.columns.ip')" />
      <Column header="" style="width: 5rem">
        <template #body="{ data }">
          <Button icon="pi pi-eye" text rounded v-tooltip.top="t('auditLogs.ariaInspect')" :aria-label="t('auditLogs.ariaInspect')" @click="openDetail(data)" />
        </template>
      </Column>
    </DataTable>

    <Dialog
      v-model:visible="detailOpen"
      :header="t('auditLogs.detail.title')"
      modal
      dismissable-mask
      :style="{ width: '50rem' }"
      :breakpoints="{ '960px': '92vw' }"
    >
      <div v-if="detail" class="flex flex-col gap-2 text-base">
        <div><strong>{{ t('auditLogs.detail.when') }}:</strong> {{ new Date(detail.occurredAt).toLocaleString() }}</div>
        <div><strong>{{ t('auditLogs.detail.action') }}:</strong> {{ detail.action }}</div>
        <div><strong>{{ t('auditLogs.detail.outcome') }}:</strong> {{ detail.outcome }}</div>
        <div><strong>{{ t('auditLogs.detail.tenant') }}:</strong> {{ detail.tenantId || '—' }}</div>
        <div><strong>{{ t('auditLogs.detail.actor') }}:</strong> {{ detail.actorLogin || '—' }} ({{ detail.actorId || '—' }})</div>
        <div><strong>{{ t('auditLogs.detail.target') }}:</strong> {{ detail.targetType || '—' }} / {{ detail.targetId || '—' }}</div>
        <div><strong>{{ t('auditLogs.detail.ip') }}:</strong> {{ detail.ip || '—' }}</div>
        <div><strong>{{ t('auditLogs.detail.userAgent') }}:</strong> {{ detail.userAgent || '—' }}</div>
        <div class="mt-2">
          <strong>{{ t('auditLogs.detail.payload') }}:</strong>
          <pre class="mt-1 p-3 rounded-md bg-surface-100 dark:bg-surface-800 overflow-auto text-sm leading-relaxed max-h-96">{{
            detail.payload ? JSON.stringify(detail.payload, null, 2) : t('auditLogs.detail.empty')
          }}</pre>
        </div>
      </div>
      <template #footer>
        <Button :label="t('common.close')" text @click="detailOpen = false" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
/* 행 전체가 클릭으로 상세를 열 수 있음을 보이게 */
.audit-table :deep(.p-datatable-tbody > tr) {
  cursor: pointer;
}
</style>
