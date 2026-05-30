<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { permissionsApi, type Permission } from '@/api/permissions'

const toast = useToast()
const confirm = useConfirm()
const { t } = useI18n()

const rows = ref<Permission[]>([])
const loading = ref(false)
const createOpen = ref(false)
const editOpen = ref(false)
const newPermission = ref({ code: '', description: '' })
const editTarget = ref<Permission | null>(null)
const editDescription = ref('')

async function reload() {
  loading.value = true
  try {
    rows.value = await permissionsApi.list()
  } catch (e) {
    toast.add({ severity: 'error', summary: t('permissions.toasts.loadFailed'), detail: msg(e), life: 4000 })
  } finally {
    loading.value = false
  }
}

function openCreate() {
  newPermission.value = { code: '', description: '' }
  createOpen.value = true
}

async function submitCreate() {
  try {
    await permissionsApi.create({
      code: newPermission.value.code,
      description: newPermission.value.description || undefined,
    })
    toast.add({ severity: 'success', summary: t('permissions.toasts.created'), life: 2500 })
    createOpen.value = false
    await reload()
  } catch (e) {
    toast.add({ severity: 'error', summary: t('toasts.createFailed'), detail: msg(e), life: 4000 })
  }
}

function openEdit(row: Permission) {
  editTarget.value = row
  editDescription.value = row.description ?? ''
  editOpen.value = true
}

async function submitEdit() {
  if (!editTarget.value) return
  try {
    await permissionsApi.updateDescription(editTarget.value.id, editDescription.value)
    toast.add({ severity: 'success', summary: t('permissions.toasts.descriptionUpdated'), life: 2500 })
    editOpen.value = false
    await reload()
  } catch (e) {
    toast.add({ severity: 'error', summary: t('toasts.updateFailed'), detail: msg(e), life: 4000 })
  }
}

function confirmDelete(row: Permission) {
  confirm.require({
    message: t('permissions.deleteConfirm.message', { code: row.code }),
    header: t('permissions.deleteConfirm.header'),
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await permissionsApi.remove(row.id)
        toast.add({ severity: 'success', summary: t('permissions.toasts.deleted'), life: 2500 })
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
      <h1 class="text-xl font-semibold">{{ t('permissions.title') }}</h1>
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
      <Column field="code" :header="t('common.code')" sortable />
      <Column field="description" :header="t('common.description')" />
      <Column header="" style="width: 10rem; text-align: right">
        <template #body="{ data }">
          <Button icon="pi pi-pencil" text rounded :aria-label="t('common.ariaEdit')" @click="openEdit(data)" />
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

    <Dialog v-model:visible="createOpen" :header="t('permissions.createDialog.title')" modal :style="{ width: '28rem' }">
      <div class="flex flex-col gap-3 pt-2">
        <InputText v-model="newPermission.code" :placeholder="t('permissions.createDialog.codePlaceholder')" />
        <Textarea
          v-model="newPermission.description"
          :placeholder="t('permissions.createDialog.descriptionPlaceholder')"
          rows="3"
          auto-resize
        />
      </div>
      <template #footer>
        <Button :label="t('common.cancel')" text @click="createOpen = false" />
        <Button :label="t('common.create')" icon="pi pi-check" @click="submitCreate" />
      </template>
    </Dialog>

    <Dialog v-model:visible="editOpen" :header="t('permissions.editDialog.title')" modal :style="{ width: '28rem' }">
      <p class="text-sm text-surface-600 dark:text-surface-300 mb-2">
        {{ t('permissions.editDialog.prompt', { code: editTarget?.code ?? '' }) }}
      </p>
      <Textarea v-model="editDescription" rows="3" auto-resize fluid />
      <template #footer>
        <Button :label="t('common.cancel')" text @click="editOpen = false" />
        <Button :label="t('common.save')" icon="pi pi-check" @click="submitEdit" />
      </template>
    </Dialog>
  </div>
</template>
