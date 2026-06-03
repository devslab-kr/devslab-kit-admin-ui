<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import EmptyState from '@/components/EmptyState.vue'
import TableSkeleton from '@/components/TableSkeleton.vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { rolesApi, type Role } from '@/api/roles'
import { permissionsApi } from '@/api/permissions'
import AssignDialog from '@/components/AssignDialog.vue'
import type { AssignOption } from '@/components/assign'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const toast = useToast()
const confirm = useConfirm()
const { t } = useI18n()

const tenantId = ref(auth.user?.tenantId ?? 'default')
const rows = ref<Role[]>([])
const loading = ref(false)
const search = ref('')
const filtered = computed(() =>
  rows.value.filter((r) => `${r.code} ${r.name}`.toLowerCase().includes(search.value.toLowerCase())),
)
const createOpen = ref(false)
const renameOpen = ref(false)
const newRole = ref({ code: '', name: '' })
const renameTarget = ref<Role | null>(null)
const renameValue = ref('')

// Permission assignment (PickList dialog)
const permOpen = ref(false)
const permRole = ref<Role | null>(null)
const allPermissions = ref<AssignOption[]>([])
const assignedPermissionIds = ref<string[]>([])
const permSaving = ref(false)

async function openPermissions(role: Role) {
  permRole.value = role
  try {
    const [perms, assigned] = await Promise.all([
      permissionsApi.list(),
      rolesApi.permissions(role.id.value),
    ])
    allPermissions.value = perms.map((p) => ({ id: p.id, label: p.code, sub: p.description }))
    assignedPermissionIds.value = assigned.map((a) => a.value)
    permOpen.value = true
  } catch (e) {
    toast.add({ severity: 'error', summary: t('roles.toasts.loadFailed'), detail: msg(e), life: 4000 })
  }
}

async function savePermissions(added: string[], removed: string[]) {
  if (!permRole.value) return
  permSaving.value = true
  const roleId = permRole.value.id.value
  try {
    for (const id of added) await rolesApi.grantPermission(roleId, id)
    for (const id of removed) await rolesApi.revokePermission(roleId, id)
    toast.add({ severity: 'success', summary: t('roles.toasts.permissionsUpdated'), life: 2500 })
    permOpen.value = false
  } catch (e) {
    toast.add({ severity: 'error', summary: t('toasts.updateFailed'), detail: msg(e), life: 4000 })
  } finally {
    permSaving.value = false
  }
}

async function reload() {
  loading.value = true
  try {
    rows.value = await rolesApi.list(tenantId.value)
  } catch (e) {
    toast.add({ severity: 'error', summary: t('roles.toasts.loadFailed'), detail: msg(e), life: 4000 })
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
    toast.add({ severity: 'success', summary: t('roles.toasts.created'), life: 2500 })
    createOpen.value = false
    await reload()
  } catch (e) {
    toast.add({ severity: 'error', summary: t('toasts.createFailed'), detail: msg(e), life: 4000 })
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
    toast.add({ severity: 'success', summary: t('roles.toasts.renamed'), life: 2500 })
    renameOpen.value = false
    await reload()
  } catch (e) {
    toast.add({ severity: 'error', summary: t('toasts.renameFailed'), detail: msg(e), life: 4000 })
  }
}

function confirmDelete(row: Role) {
  confirm.require({
    message: t('roles.deleteConfirm.message', { code: row.code }),
    header: t('roles.deleteConfirm.header'),
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await rolesApi.remove(row.id.value)
        toast.add({ severity: 'success', summary: t('roles.toasts.deleted'), life: 2500 })
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
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-xl font-semibold">{{ t('roles.title') }}</h1>
        <p class="text-sm text-surface-500 dark:text-surface-400 mt-0.5">{{ t('subtitles.roles') }}</p>
      </div>
      <div class="flex items-center gap-2">
        <InputText v-model="search" :placeholder="t('common.search')" class="w-56" />
        <Button icon="pi pi-refresh" severity="secondary" outlined v-tooltip.top="t('common.ariaRefresh')" :aria-label="t('common.ariaRefresh')" @click="reload" />
        <Button icon="pi pi-plus" :label="t('common.create')" @click="openCreate" />
      </div>
    </div>

    <TableSkeleton v-if="loading && !filtered.length" :columns="3" :rows="8" :label="t('common.loading')" />
    <DataTable
      v-else
      :value="filtered"
      :loading="loading"
      striped-rows
      paginator
      :rows="10"
      data-key="id.value"
    >
      <template #empty>
        <EmptyState :message="t('common.noResults')" />
      </template>
      <Column field="code" :header="t('common.code')" sortable />
      <Column field="name" :header="t('common.name')" sortable />
      <Column header="" style="width: 10rem; text-align: right">
        <template #body="{ data }">
          <Button
            icon="pi pi-key"
            text
            rounded
            v-tooltip.top="t('roles.managePermissions')" :aria-label="t('roles.managePermissions')"
            @click="openPermissions(data)"
          />
          <Button icon="pi pi-pencil" text rounded v-tooltip.top="t('common.ariaRename')" :aria-label="t('common.ariaRename')" @click="openRename(data)" />
          <Button
            icon="pi pi-trash"
            text
            rounded
            severity="danger"
            v-tooltip.top="t('common.ariaDelete')" :aria-label="t('common.ariaDelete')"
            @click="confirmDelete(data)"
          />
        </template>
      </Column>
    </DataTable>

    <Dialog v-model:visible="createOpen" :header="t('roles.createDialog.title')" modal :style="{ width: '24rem' }">
      <div class="flex flex-col gap-3 pt-2">
        <InputText v-model="newRole.code" :placeholder="t('roles.createDialog.codePlaceholder')" />
        <InputText v-model="newRole.name" :placeholder="t('roles.createDialog.namePlaceholder')" />
      </div>
      <template #footer>
        <Button :label="t('common.cancel')" text @click="createOpen = false" />
        <Button :label="t('common.create')" icon="pi pi-check" @click="submitCreate" />
      </template>
    </Dialog>

    <Dialog v-model:visible="renameOpen" :header="t('roles.renameDialog.title')" modal :style="{ width: '24rem' }">
      <p class="text-sm text-surface-600 dark:text-surface-300 mb-2">
        {{ t('roles.renameDialog.prompt', { code: renameTarget?.code ?? '' }) }}
      </p>
      <InputText v-model="renameValue" fluid />
      <template #footer>
        <Button :label="t('common.cancel')" text @click="renameOpen = false" />
        <Button :label="t('common.save')" icon="pi pi-check" @click="submitRename" />
      </template>
    </Dialog>

    <AssignDialog
      v-model:visible="permOpen"
      :title="t('roles.permissionsDialog.title', { code: permRole?.code ?? '' })"
      :all="allPermissions"
      :assigned-ids="assignedPermissionIds"
      :saving="permSaving"
      @save="savePermissions"
    />
  </div>
</template>
