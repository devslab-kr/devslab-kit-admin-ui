<script setup lang="ts">
import { onMounted, ref } from 'vue'
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
    toast.add({ severity: 'error', summary: 'Failed to load permissions', detail: msg(e), life: 4000 })
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
    toast.add({ severity: 'success', summary: 'Permission created', life: 2500 })
    createOpen.value = false
    await reload()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Create failed', detail: msg(e), life: 4000 })
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
    toast.add({ severity: 'success', summary: 'Description updated', life: 2500 })
    editOpen.value = false
    await reload()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Update failed', detail: msg(e), life: 4000 })
  }
}

function confirmDelete(row: Permission) {
  confirm.require({
    message: `Delete permission "${row.code}"?`,
    header: 'Delete permission',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await permissionsApi.remove(row.id)
        toast.add({ severity: 'success', summary: 'Permission deleted', life: 2500 })
        await reload()
      } catch (e) {
        toast.add({ severity: 'error', summary: 'Delete failed', detail: msg(e), life: 4000 })
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
      <h1 class="text-xl font-semibold">Permissions</h1>
      <div class="flex items-center gap-2">
        <Button icon="pi pi-refresh" severity="secondary" outlined @click="reload" />
        <Button icon="pi pi-plus" label="Create" @click="openCreate" />
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
      <Column field="code" header="Code" sortable />
      <Column field="description" header="Description" />
      <Column header="" style="width: 10rem; text-align: right">
        <template #body="{ data }">
          <Button icon="pi pi-pencil" text rounded @click="openEdit(data)" aria-label="Edit" />
          <Button
            icon="pi pi-trash"
            text
            rounded
            severity="danger"
            @click="confirmDelete(data)"
            aria-label="Delete"
          />
        </template>
      </Column>
    </DataTable>

    <Dialog v-model:visible="createOpen" header="Create permission" modal :style="{ width: '28rem' }">
      <div class="flex flex-col gap-3 pt-2">
        <InputText v-model="newPermission.code" placeholder="Code (e.g. admin.user.read)" />
        <Textarea v-model="newPermission.description" placeholder="Description (optional)" rows="3" auto-resize />
      </div>
      <template #footer>
        <Button label="Cancel" text @click="createOpen = false" />
        <Button label="Create" icon="pi pi-check" @click="submitCreate" />
      </template>
    </Dialog>

    <Dialog v-model:visible="editOpen" header="Edit permission" modal :style="{ width: '28rem' }">
      <p class="text-sm text-surface-600 dark:text-surface-300 mb-2">
        Description for <strong>{{ editTarget?.code }}</strong>
      </p>
      <Textarea v-model="editDescription" rows="3" auto-resize fluid />
      <template #footer>
        <Button label="Cancel" text @click="editOpen = false" />
        <Button label="Save" icon="pi pi-check" @click="submitEdit" />
      </template>
    </Dialog>
  </div>
</template>
