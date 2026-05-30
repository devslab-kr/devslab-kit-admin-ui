<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { groupsApi, type Group } from '@/api/groups'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const toast = useToast()
const confirm = useConfirm()
const { t } = useI18n()

const tenantId = ref(auth.user?.tenantId ?? 'default')
const rows = ref<Group[]>([])
const loading = ref(false)

const createOpen = ref(false)
const renameOpen = ref(false)
const newGroup = ref({ code: '', name: '' })
const renameTarget = ref<Group | null>(null)
const renameValue = ref('')

async function reload() {
  loading.value = true
  try {
    rows.value = await groupsApi.list(tenantId.value)
  } catch (e) {
    toast.add({ severity: 'error', summary: t('groups.toasts.loadFailed'), detail: msg(e), life: 4000 })
  } finally {
    loading.value = false
  }
}

function openCreate() {
  newGroup.value = { code: '', name: '' }
  createOpen.value = true
}

async function submitCreate() {
  try {
    await groupsApi.create({ tenantId: tenantId.value, code: newGroup.value.code, name: newGroup.value.name })
    toast.add({ severity: 'success', summary: t('groups.toasts.created'), life: 2500 })
    createOpen.value = false
    await reload()
  } catch (e) {
    toast.add({ severity: 'error', summary: t('toasts.createFailed'), detail: msg(e), life: 4000 })
  }
}

function openRename(row: Group) {
  renameTarget.value = row
  renameValue.value = row.name
  renameOpen.value = true
}

async function submitRename() {
  if (!renameTarget.value) return
  try {
    await groupsApi.rename(renameTarget.value.id.value, renameValue.value)
    toast.add({ severity: 'success', summary: t('groups.toasts.renamed'), life: 2500 })
    renameOpen.value = false
    await reload()
  } catch (e) {
    toast.add({ severity: 'error', summary: t('toasts.renameFailed'), detail: msg(e), life: 4000 })
  }
}

function confirmDelete(row: Group) {
  confirm.require({
    message: t('groups.deleteConfirm.message', { code: row.code }),
    header: t('groups.deleteConfirm.header'),
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await groupsApi.remove(row.id.value)
        toast.add({ severity: 'success', summary: t('groups.toasts.deleted'), life: 2500 })
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
      <h1 class="text-xl font-semibold">{{ t('groups.title') }}</h1>
      <div class="flex items-center gap-2">
        <InputText v-model="tenantId" :placeholder="t('common.tenantId')" class="w-48" />
        <Button icon="pi pi-refresh" severity="secondary" outlined :aria-label="t('common.ariaRefresh')" @click="reload" />
        <Button icon="pi pi-plus" :label="t('common.create')" @click="openCreate" />
      </div>
    </div>

    <DataTable
      :value="rows"
      :loading="loading"
      striped-rows
      paginator
      :rows="10"
      data-key="id.value"
    >
      <Column field="code" :header="t('common.code')" sortable />
      <Column field="name" :header="t('common.name')" sortable />
      <Column header="" style="width: 10rem; text-align: right">
        <template #body="{ data }">
          <Button icon="pi pi-pencil" text rounded :aria-label="t('common.ariaRename')" @click="openRename(data)" />
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

    <Dialog v-model:visible="createOpen" :header="t('groups.createDialog.title')" modal :style="{ width: '24rem' }">
      <div class="flex flex-col gap-3 pt-2">
        <InputText v-model="newGroup.code" :placeholder="t('groups.createDialog.codePlaceholder')" />
        <InputText v-model="newGroup.name" :placeholder="t('groups.createDialog.namePlaceholder')" />
      </div>
      <template #footer>
        <Button :label="t('common.cancel')" text @click="createOpen = false" />
        <Button :label="t('common.create')" icon="pi pi-check" @click="submitCreate" />
      </template>
    </Dialog>

    <Dialog v-model:visible="renameOpen" :header="t('groups.renameDialog.title')" modal :style="{ width: '24rem' }">
      <p class="text-sm text-surface-600 dark:text-surface-300 mb-2">
        {{ t('groups.renameDialog.prompt', { code: renameTarget?.code ?? '' }) }}
      </p>
      <InputText v-model="renameValue" fluid />
      <template #footer>
        <Button :label="t('common.cancel')" text @click="renameOpen = false" />
        <Button :label="t('common.save')" icon="pi pi-check" @click="submitRename" />
      </template>
    </Dialog>
  </div>
</template>
