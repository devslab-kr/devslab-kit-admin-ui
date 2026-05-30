<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { tenantsApi, type Tenant } from '@/api/tenants'

const toast = useToast()
const confirm = useConfirm()
const { t } = useI18n()

const rows = ref<Tenant[]>([])
const loading = ref(false)

const createOpen = ref(false)
const renameOpen = ref(false)
const statusOpen = ref(false)
const newTenant = ref({ id: '', name: '' })
const renameTarget = ref<Tenant | null>(null)
const renameValue = ref('')
const statusTarget = ref<Tenant | null>(null)
const newStatus = ref<Tenant['status']>('ACTIVE')

const statusOptions: Tenant['status'][] = ['ACTIVE', 'SUSPENDED', 'ARCHIVED']

const statusSeverity = (s: Tenant['status']) =>
  s === 'ACTIVE' ? 'success' : s === 'SUSPENDED' ? 'warn' : 'secondary'

async function reload() {
  loading.value = true
  try {
    rows.value = await tenantsApi.list()
  } catch (e) {
    toast.add({ severity: 'error', summary: t('tenants.toasts.loadFailed'), detail: msg(e), life: 4000 })
  } finally {
    loading.value = false
  }
}

function openCreate() {
  newTenant.value = { id: '', name: '' }
  createOpen.value = true
}

async function submitCreate() {
  try {
    await tenantsApi.create({ id: newTenant.value.id, name: newTenant.value.name })
    toast.add({ severity: 'success', summary: t('tenants.toasts.created'), life: 2500 })
    createOpen.value = false
    await reload()
  } catch (e) {
    toast.add({ severity: 'error', summary: t('toasts.createFailed'), detail: msg(e), life: 4000 })
  }
}

function openRename(row: Tenant) {
  renameTarget.value = row
  renameValue.value = row.name
  renameOpen.value = true
}

async function submitRename() {
  if (!renameTarget.value) return
  try {
    await tenantsApi.rename(renameTarget.value.id, renameValue.value)
    toast.add({ severity: 'success', summary: t('tenants.toasts.renamed'), life: 2500 })
    renameOpen.value = false
    await reload()
  } catch (e) {
    toast.add({ severity: 'error', summary: t('toasts.renameFailed'), detail: msg(e), life: 4000 })
  }
}

function openStatus(row: Tenant) {
  statusTarget.value = row
  newStatus.value = row.status
  statusOpen.value = true
}

async function submitStatus() {
  if (!statusTarget.value) return
  try {
    await tenantsApi.updateStatus(statusTarget.value.id, newStatus.value)
    toast.add({ severity: 'success', summary: t('tenants.toasts.statusUpdated'), life: 2500 })
    statusOpen.value = false
    await reload()
  } catch (e) {
    toast.add({ severity: 'error', summary: t('tenants.toasts.statusFailed'), detail: msg(e), life: 4000 })
  }
}

function confirmDelete(row: Tenant) {
  confirm.require({
    message: t('tenants.deleteConfirm.message', { id: row.id }),
    header: t('tenants.deleteConfirm.header'),
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await tenantsApi.remove(row.id)
        toast.add({ severity: 'success', summary: t('tenants.toasts.deleted'), life: 2500 })
        await reload()
      } catch (e) {
        toast.add({ severity: 'error', summary: t('toasts.deleteFailed'), detail: msg(e), life: 4000 })
      }
    },
  })
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
      <h1 class="text-xl font-semibold">{{ t('tenants.title') }}</h1>
      <div class="flex items-center gap-2">
        <Button icon="pi pi-refresh" severity="secondary" outlined :aria-label="t('common.ariaRefresh')" @click="reload" />
        <Button icon="pi pi-plus" :label="t('common.create')" @click="openCreate" />
      </div>
    </div>

    <DataTable
      :value="rows"
      :loading="loading"
      striped-rows
      paginator
      :rows="15"
      data-key="id"
    >
      <Column field="id" :header="t('tenants.columns.id')" sortable />
      <Column field="name" :header="t('tenants.columns.name')" sortable />
      <Column :header="t('tenants.columns.status')" sortable>
        <template #body="{ data }">
          <Tag :value="data.status" :severity="statusSeverity(data.status)" />
        </template>
      </Column>
      <Column field="createdAt" :header="t('tenants.columns.created')">
        <template #body="{ data }">
          {{ data.createdAt ? new Date(data.createdAt).toLocaleString() : '—' }}
        </template>
      </Column>
      <Column header="" style="width: 12rem; text-align: right">
        <template #body="{ data }">
          <Button icon="pi pi-pencil" text rounded :aria-label="t('common.ariaRename')" @click="openRename(data)" />
          <Button icon="pi pi-power-off" text rounded :aria-label="t('tenants.columns.status')" @click="openStatus(data)" />
          <Button
            icon="pi pi-trash"
            text
            rounded
            severity="danger"
            :aria-label="t('common.ariaDelete')"
            @click="confirmDelete(data)"
          />
        </template>
      </Column>
    </DataTable>

    <Dialog v-model:visible="createOpen" :header="t('tenants.createDialog.title')" modal :style="{ width: '24rem' }">
      <div class="flex flex-col gap-3 pt-2">
        <InputText v-model="newTenant.id" :placeholder="t('tenants.createDialog.idPlaceholder')" />
        <InputText v-model="newTenant.name" :placeholder="t('tenants.createDialog.namePlaceholder')" />
      </div>
      <template #footer>
        <Button :label="t('common.cancel')" text @click="createOpen = false" />
        <Button :label="t('common.create')" icon="pi pi-check" @click="submitCreate" />
      </template>
    </Dialog>

    <Dialog v-model:visible="renameOpen" :header="t('tenants.renameDialog.title')" modal :style="{ width: '24rem' }">
      <p class="text-sm text-surface-600 dark:text-surface-300 mb-2">
        {{ t('tenants.renameDialog.prompt', { id: renameTarget?.id ?? '' }) }}
      </p>
      <InputText v-model="renameValue" fluid />
      <template #footer>
        <Button :label="t('common.cancel')" text @click="renameOpen = false" />
        <Button :label="t('common.save')" icon="pi pi-check" @click="submitRename" />
      </template>
    </Dialog>

    <Dialog v-model:visible="statusOpen" :header="t('tenants.statusDialog.title')" modal :style="{ width: '24rem' }">
      <p class="text-sm text-surface-600 dark:text-surface-300 mb-2">
        {{ t('tenants.statusDialog.prompt', { id: statusTarget?.id ?? '' }) }}
      </p>
      <Select v-model="newStatus" :options="statusOptions" fluid />
      <template #footer>
        <Button :label="t('common.cancel')" text @click="statusOpen = false" />
        <Button :label="t('common.save')" icon="pi pi-check" @click="submitStatus" />
      </template>
    </Dialog>
  </div>
</template>
