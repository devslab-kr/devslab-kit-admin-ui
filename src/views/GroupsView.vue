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
import { groupsApi, type Group } from '@/api/groups'
import { usersApi } from '@/api/users'
import { rolesApi } from '@/api/roles'
import AssignDialog from '@/components/AssignDialog.vue'
import type { AssignOption } from '@/components/assign'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const toast = useToast()
const confirm = useConfirm()
const { t } = useI18n()

const tenantId = ref(auth.user?.tenantId ?? 'default')
const rows = ref<Group[]>([])
const loading = ref(false)
const search = ref('')
const filtered = computed(() =>
  rows.value.filter((g) => `${g.code} ${g.name}`.toLowerCase().includes(search.value.toLowerCase())),
)

const createOpen = ref(false)
const renameOpen = ref(false)
const newGroup = ref({ code: '', name: '' })
const renameTarget = ref<Group | null>(null)
const renameValue = ref('')

// Member management (PickList dialog)
const memberOpen = ref(false)
const memberGroup = ref<Group | null>(null)
const allUsers = ref<AssignOption[]>([])
const assignedMemberIds = ref<string[]>([])
const memberSaving = ref(false)

async function openMembers(group: Group) {
  memberGroup.value = group
  try {
    const [users, members] = await Promise.all([
      usersApi.list(tenantId.value),
      groupsApi.members(group.id.value),
    ])
    allUsers.value = users.map((u) => ({ id: u.id.value, label: u.loginId, sub: u.email }))
    assignedMemberIds.value = members.map((m) => m.value)
    memberOpen.value = true
  } catch (e) {
    toast.add({ severity: 'error', summary: t('groups.toasts.loadFailed'), detail: msg(e), life: 4000 })
  }
}

async function saveMembers(added: string[], removed: string[]) {
  if (!memberGroup.value) return
  memberSaving.value = true
  const groupId = memberGroup.value.id.value
  try {
    for (const id of added) await groupsApi.addMember(groupId, id)
    for (const id of removed) await groupsApi.removeMember(groupId, id)
    toast.add({ severity: 'success', summary: t('groups.toasts.membersUpdated'), life: 2500 })
    memberOpen.value = false
  } catch (e) {
    toast.add({ severity: 'error', summary: t('toasts.updateFailed'), detail: msg(e), life: 4000 })
  } finally {
    memberSaving.value = false
  }
}

// Role assignment (PickList dialog) — group roles flow to its members
const roleOpen = ref(false)
const roleGroup = ref<Group | null>(null)
const allRoles = ref<AssignOption[]>([])
const assignedRoleIds = ref<string[]>([])
const roleSaving = ref(false)

async function openRoles(group: Group) {
  roleGroup.value = group
  try {
    const [roles, assigned] = await Promise.all([
      rolesApi.list(tenantId.value),
      groupsApi.roles(group.id.value),
    ])
    allRoles.value = roles.map((r) => ({ id: r.id.value, label: r.code, sub: r.name }))
    assignedRoleIds.value = assigned.map((a) => a.value)
    roleOpen.value = true
  } catch (e) {
    toast.add({ severity: 'error', summary: t('groups.toasts.loadFailed'), detail: msg(e), life: 4000 })
  }
}

async function saveRoles(added: string[], removed: string[]) {
  if (!roleGroup.value) return
  roleSaving.value = true
  const groupId = roleGroup.value.id.value
  try {
    for (const id of added) await groupsApi.grantRole(groupId, id)
    for (const id of removed) await groupsApi.revokeRole(groupId, id)
    toast.add({ severity: 'success', summary: t('groups.toasts.rolesUpdated'), life: 2500 })
    roleOpen.value = false
  } catch (e) {
    toast.add({ severity: 'error', summary: t('toasts.updateFailed'), detail: msg(e), life: 4000 })
  } finally {
    roleSaving.value = false
  }
}

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
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-xl font-semibold">{{ t('groups.title') }}</h1>
        <p class="text-sm text-surface-500 dark:text-surface-400 mt-0.5">{{ t('subtitles.groups') }}</p>
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
          <Button icon="pi pi-users" text rounded v-tooltip.top="t('groups.manageMembers')" :aria-label="t('groups.manageMembers')" @click="openMembers(data)" />
          <Button icon="pi pi-key" text rounded v-tooltip.top="t('groups.manageRoles')" :aria-label="t('groups.manageRoles')" @click="openRoles(data)" />
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

    <AssignDialog
      v-model:visible="memberOpen"
      :title="t('groups.membersDialog.title', { code: memberGroup?.code ?? '' })"
      :all="allUsers"
      :assigned-ids="assignedMemberIds"
      :saving="memberSaving"
      @save="saveMembers"
    />
    <AssignDialog
      v-model:visible="roleOpen"
      :title="t('groups.rolesDialog.title', { code: roleGroup?.code ?? '' })"
      :all="allRoles"
      :assigned-ids="assignedRoleIds"
      :saving="roleSaving"
      @save="saveRoles"
    />
  </div>
</template>
