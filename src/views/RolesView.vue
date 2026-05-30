<script setup lang="ts">
import { onMounted, ref } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { rolesApi, type Role } from '@/api/roles'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const toast = useToast()
const confirm = useConfirm()

const tenantId = ref(auth.user?.tenantId ?? 'default')
const rows = ref<Role[]>([])
const loading = ref(false)
const createOpen = ref(false)
const renameOpen = ref(false)
const newRole = ref({ code: '', name: '' })
const renameTarget = ref<Role | null>(null)
const renameValue = ref('')

async function reload() {
  loading.value = true
  try {
    rows.value = await rolesApi.list(tenantId.value)
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Failed to load roles', detail: msg(e), life: 4000 })
  } finally {
    loading.value = false
  }
}

function openCreate() {
  newRole.value = { code: '', name: '' }
  createOpen.value = true
}

async function submitCreate() {
  try {
    await rolesApi.create({ tenantId: tenantId.value, code: newRole.value.code, name: newRole.value.name })
    toast.add({ severity: 'success', summary: 'Role created', life: 2500 })
    createOpen.value = false
    await reload()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Create failed', detail: msg(e), life: 4000 })
  }
}

function openRename(row: Role) {
  renameTarget.value = row
  renameValue.value = row.name
  renameOpen.value = true
}

async function submitRename() {
  if (!renameTarget.value) return
  try {
    await rolesApi.rename(renameTarget.value.id.value, renameValue.value)
    toast.add({ severity: 'success', summary: 'Role renamed', life: 2500 })
    renameOpen.value = false
    await reload()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Rename failed', detail: msg(e), life: 4000 })
  }
}

function confirmDelete(row: Role) {
  confirm.require({
    message: `Delete role "${row.code}"?`,
    header: 'Delete role',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await rolesApi.remove(row.id.value)
        toast.add({ severity: 'success', summary: 'Role deleted', life: 2500 })
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
      <h1 class="text-xl font-semibold">Roles</h1>
      <div class="flex items-center gap-2">
        <InputText v-model="tenantId" placeholder="tenantId" class="w-48" />
        <Button icon="pi pi-refresh" severity="secondary" outlined @click="reload" />
        <Button icon="pi pi-plus" label="Create" @click="openCreate" />
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
      <Column field="code" header="Code" sortable />
      <Column field="name" header="Name" sortable />
      <Column header="" style="width: 10rem; text-align: right">
        <template #body="{ data }">
          <Button icon="pi pi-pencil" text rounded @click="openRename(data)" aria-label="Rename" />
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

    <Dialog v-model:visible="createOpen" header="Create role" modal :style="{ width: '24rem' }">
      <div class="flex flex-col gap-3 pt-2">
        <InputText v-model="newRole.code" placeholder="Code (e.g. ADMIN)" />
        <InputText v-model="newRole.name" placeholder="Display name" />
      </div>
      <template #footer>
        <Button label="Cancel" text @click="createOpen = false" />
        <Button label="Create" icon="pi pi-check" @click="submitCreate" />
      </template>
    </Dialog>

    <Dialog v-model:visible="renameOpen" header="Rename role" modal :style="{ width: '24rem' }">
      <p class="text-sm text-surface-600 dark:text-surface-300 mb-2">
        New name for <strong>{{ renameTarget?.code }}</strong>
      </p>
      <InputText v-model="renameValue" fluid />
      <template #footer>
        <Button label="Cancel" text @click="renameOpen = false" />
        <Button label="Save" icon="pi pi-check" @click="submitRename" />
      </template>
    </Dialog>
  </div>
</template>
