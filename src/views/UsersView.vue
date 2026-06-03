<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import EmptyState from '@/components/EmptyState.vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { usersApi, type UserAccount } from '@/api/users'
import { rolesApi } from '@/api/roles'
import { groupsApi } from '@/api/groups'
import AssignDialog from '@/components/AssignDialog.vue'
import type { AssignOption } from '@/components/assign'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const toast = useToast()
const confirm = useConfirm()
const { t } = useI18n()

const tenantId = ref(auth.user?.tenantId ?? 'default')
const rows = ref<UserAccount[]>([])
const loading = ref(false)
const search = ref('')
const filtered = computed(() =>
  rows.value.filter((u) =>
    `${u.loginId} ${u.email ?? ''} ${u.status}`.toLowerCase().includes(search.value.toLowerCase()),
  ),
)

const createOpen = ref(false)
const passwordDialogOpen = ref(false)
const statusDialogOpen = ref(false)

const newUser = ref({ loginId: '', email: '', rawPassword: '', providerType: 'LOCAL' })
const passwordTarget = ref<UserAccount | null>(null)
const newPassword = ref('')
const statusTarget = ref<UserAccount | null>(null)
const newStatus = ref<UserAccount['status']>('ACTIVE')

// Role / group assignment (PickList dialogs) — manage a user's access from the user side.
const rolesOpen = ref(false)
const rolesUser = ref<UserAccount | null>(null)
const allRoles = ref<AssignOption[]>([])
const assignedRoleIds = ref<string[]>([])
const rolesSaving = ref(false)

const groupsOpen = ref(false)
const groupsUser = ref<UserAccount | null>(null)
const allGroups = ref<AssignOption[]>([])
const assignedGroupIds = ref<string[]>([])
const groupsSaving = ref(false)

const statusOptions = ['ACTIVE', 'LOCKED', 'DISABLED', 'PENDING_VERIFICATION']

const statusSeverity = (s: UserAccount['status']) =>
  s === 'ACTIVE' ? 'success' : s === 'LOCKED' ? 'warn' : s === 'DISABLED' ? 'danger' : 'info'

async function reload() {
  loading.value = true
  try {
    rows.value = await usersApi.list(tenantId.value)
  } catch (e) {
    toast.add({ severity: 'error', summary: t('users.toasts.loadFailed'), detail: extractMsg(e), life: 4000 })
  } finally {
    loading.value = false
  }
}

function openCreate() {
  newUser.value = { loginId: '', email: '', rawPassword: '', providerType: 'LOCAL' }
  createOpen.value = true
}

async function submitCreate() {
  try {
    await usersApi.create({
      tenantId: tenantId.value,
      loginId: newUser.value.loginId,
      email: newUser.value.email || undefined,
      rawPassword: newUser.value.rawPassword,
      providerType: newUser.value.providerType || undefined,
    })
    toast.add({ severity: 'success', summary: t('users.toasts.created'), life: 2500 })
    createOpen.value = false
    await reload()
  } catch (e) {
    toast.add({ severity: 'error', summary: t('toasts.createFailed'), detail: extractMsg(e), life: 4000 })
  }
}

async function toggleLock(row: UserAccount) {
  try {
    if (row.locked) await usersApi.unlock(row.id.value)
    else await usersApi.lock(row.id.value)
    await reload()
  } catch (e) {
    toast.add({ severity: 'error', summary: t('users.toasts.lockFailed'), detail: extractMsg(e), life: 4000 })
  }
}

function openPassword(row: UserAccount) {
  passwordTarget.value = row
  newPassword.value = ''
  passwordDialogOpen.value = true
}

async function submitPassword() {
  if (!passwordTarget.value) return
  try {
    await usersApi.resetPassword(passwordTarget.value.id.value, { newRawPassword: newPassword.value })
    toast.add({ severity: 'success', summary: t('users.toasts.passwordReset'), life: 2500 })
    passwordDialogOpen.value = false
  } catch (e) {
    toast.add({ severity: 'error', summary: t('users.toasts.passwordFailed'), detail: extractMsg(e), life: 4000 })
  }
}

function openStatus(row: UserAccount) {
  statusTarget.value = row
  newStatus.value = row.status
  statusDialogOpen.value = true
}

async function submitStatus() {
  if (!statusTarget.value) return
  try {
    await usersApi.updateStatus(statusTarget.value.id.value, { status: newStatus.value })
    toast.add({ severity: 'success', summary: t('users.toasts.statusUpdated'), life: 2500 })
    statusDialogOpen.value = false
    await reload()
  } catch (e) {
    toast.add({ severity: 'error', summary: t('users.toasts.statusFailed'), detail: extractMsg(e), life: 4000 })
  }
}

async function openRoles(user: UserAccount) {
  rolesUser.value = user
  try {
    const [roles, assigned] = await Promise.all([rolesApi.list(tenantId.value), usersApi.roles(user.id.value)])
    allRoles.value = roles.map((r) => ({ id: r.id.value, label: r.code, sub: r.name }))
    assignedRoleIds.value = assigned.map((a) => a.value)
    rolesOpen.value = true
  } catch (e) {
    toast.add({ severity: 'error', summary: t('users.toasts.loadFailed'), detail: extractMsg(e), life: 4000 })
  }
}

async function saveRoles(added: string[], removed: string[]) {
  if (!rolesUser.value) return
  rolesSaving.value = true
  const userId = rolesUser.value.id.value
  try {
    for (const roleId of added) await rolesApi.assignToUser(roleId, userId, tenantId.value)
    for (const roleId of removed) await rolesApi.revokeFromUser(roleId, userId)
    toast.add({ severity: 'success', summary: t('users.toasts.rolesUpdated'), life: 2500 })
    rolesOpen.value = false
  } catch (e) {
    toast.add({ severity: 'error', summary: t('toasts.updateFailed'), detail: extractMsg(e), life: 4000 })
  } finally {
    rolesSaving.value = false
  }
}

async function openGroups(user: UserAccount) {
  groupsUser.value = user
  try {
    const [groups, assigned] = await Promise.all([groupsApi.list(tenantId.value), usersApi.groups(user.id.value)])
    allGroups.value = groups.map((g) => ({ id: g.id.value, label: g.code, sub: g.name }))
    assignedGroupIds.value = assigned.map((a) => a.value)
    groupsOpen.value = true
  } catch (e) {
    toast.add({ severity: 'error', summary: t('users.toasts.loadFailed'), detail: extractMsg(e), life: 4000 })
  }
}

async function saveGroups(added: string[], removed: string[]) {
  if (!groupsUser.value) return
  groupsSaving.value = true
  const userId = groupsUser.value.id.value
  try {
    for (const groupId of added) await groupsApi.addMember(groupId, userId)
    for (const groupId of removed) await groupsApi.removeMember(groupId, userId)
    toast.add({ severity: 'success', summary: t('users.toasts.groupsUpdated'), life: 2500 })
    groupsOpen.value = false
  } catch (e) {
    toast.add({ severity: 'error', summary: t('toasts.updateFailed'), detail: extractMsg(e), life: 4000 })
  } finally {
    groupsSaving.value = false
  }
}

function confirmDelete(row: UserAccount) {
  confirm.require({
    message: t('users.deleteConfirm.message', { loginId: row.loginId }),
    header: t('users.deleteConfirm.header'),
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await usersApi.remove(row.id.value)
        toast.add({ severity: 'success', summary: t('users.toasts.deleted'), life: 2500 })
        await reload()
      } catch (e) {
        toast.add({ severity: 'error', summary: t('toasts.deleteFailed'), detail: extractMsg(e), life: 4000 })
      }
    },
  })
}

function extractMsg(e: unknown): string {
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
      <h1 class="text-xl font-semibold">{{ t('users.title') }}</h1>
      <div class="flex items-center gap-2">
        <InputText v-model="search" :placeholder="t('common.search')" class="w-56" />
        <Button icon="pi pi-refresh" severity="secondary" outlined v-tooltip.top="t('common.ariaRefresh')" :aria-label="t('common.ariaRefresh')" @click="reload" />
        <Button icon="pi pi-plus" :label="t('common.create')" @click="openCreate" />
      </div>
    </div>

    <DataTable
      :value="filtered"
      :loading="loading"
      striped-rows
      paginator
      :rows="10"
      :rows-per-page-options="[10, 25, 50]"
      data-key="id.value"
    >
      <template #empty>
        <EmptyState :message="t('common.noResults')" />
      </template>
      <Column field="loginId" :header="t('users.columns.loginId')" sortable />
      <Column field="email" :header="t('users.columns.email')" />
      <Column :header="t('users.columns.status')" sortable>
        <template #body="{ data }">
          <Tag :value="data.status" :severity="statusSeverity(data.status)" />
        </template>
      </Column>
      <Column :header="t('users.columns.locked')">
        <template #body="{ data }">
          <i :class="['pi', data.locked ? 'pi-lock text-orange-500' : 'pi-lock-open text-green-500']"></i>
        </template>
      </Column>
      <Column field="providerType" :header="t('users.columns.provider')" />
      <Column header="" style="width: 18rem; text-align: right">
        <template #body="{ data }">
          <div class="flex items-center justify-end gap-1">
            <Button
              :icon="data.locked ? 'pi pi-lock-open' : 'pi pi-lock'"
              :severity="data.locked ? 'success' : 'warn'"
              text
              rounded
              v-tooltip.top="data.locked ? t('users.ariaLockToggle.unlock') : t('users.ariaLockToggle.lock')" :aria-label="data.locked ? t('users.ariaLockToggle.unlock') : t('users.ariaLockToggle.lock')"
              @click="toggleLock(data)"
            />
            <Button icon="pi pi-key" text rounded v-tooltip.top="t('users.ariaResetPassword')" :aria-label="t('users.ariaResetPassword')" @click="openPassword(data)" />
            <Button icon="pi pi-id-card" text rounded v-tooltip.top="t('users.ariaManageRoles')" :aria-label="t('users.ariaManageRoles')" @click="openRoles(data)" />
            <Button icon="pi pi-users" text rounded v-tooltip.top="t('users.ariaManageGroups')" :aria-label="t('users.ariaManageGroups')" @click="openGroups(data)" />
            <Button icon="pi pi-pencil" text rounded v-tooltip.top="t('users.ariaChangeStatus')" :aria-label="t('users.ariaChangeStatus')" @click="openStatus(data)" />
            <Button
              icon="pi pi-trash"
              text
              rounded
              severity="danger"
              v-tooltip.top="t('common.ariaDelete')" :aria-label="t('common.ariaDelete')"
              @click="confirmDelete(data)"
            />
          </div>
        </template>
      </Column>
    </DataTable>

    <Dialog v-model:visible="createOpen" :header="t('users.createDialog.title')" modal :style="{ width: '28rem' }">
      <div class="flex flex-col gap-3 pt-2">
        <InputText v-model="newUser.loginId" :placeholder="t('users.createDialog.loginIdPlaceholder')" />
        <InputText v-model="newUser.email" :placeholder="t('users.createDialog.emailPlaceholder')" />
        <Password
          v-model="newUser.rawPassword"
          :placeholder="t('users.createDialog.passwordPlaceholder')"
          :feedback="false"
          toggle-mask
          fluid
        />
        <InputText v-model="newUser.providerType" :placeholder="t('users.createDialog.providerPlaceholder')" />
      </div>
      <template #footer>
        <Button :label="t('common.cancel')" text @click="createOpen = false" />
        <Button :label="t('common.create')" icon="pi pi-check" @click="submitCreate" />
      </template>
    </Dialog>

    <Dialog v-model:visible="passwordDialogOpen" :header="t('users.passwordDialog.title')" modal :style="{ width: '24rem' }">
      <p class="text-sm text-surface-600 dark:text-surface-300 mb-2">
        {{ t('users.passwordDialog.prompt', { loginId: passwordTarget?.loginId ?? '' }) }}
      </p>
      <Password v-model="newPassword" :feedback="false" toggle-mask fluid />
      <template #footer>
        <Button :label="t('common.cancel')" text @click="passwordDialogOpen = false" />
        <Button :label="t('common.reset')" icon="pi pi-check" @click="submitPassword" />
      </template>
    </Dialog>

    <Dialog v-model:visible="statusDialogOpen" :header="t('users.statusDialog.title')" modal :style="{ width: '24rem' }">
      <p class="text-sm text-surface-600 dark:text-surface-300 mb-2">
        {{ t('users.statusDialog.prompt', { loginId: statusTarget?.loginId ?? '' }) }}
      </p>
      <Select v-model="newStatus" :options="statusOptions" fluid />
      <template #footer>
        <Button :label="t('common.cancel')" text @click="statusDialogOpen = false" />
        <Button :label="t('common.save')" icon="pi pi-check" @click="submitStatus" />
      </template>
    </Dialog>

    <AssignDialog
      v-model:visible="rolesOpen"
      :title="t('users.rolesDialog.title', { loginId: rolesUser?.loginId ?? '' })"
      :all="allRoles"
      :assigned-ids="assignedRoleIds"
      :saving="rolesSaving"
      @save="saveRoles"
    />

    <AssignDialog
      v-model:visible="groupsOpen"
      :title="t('users.groupsDialog.title', { loginId: groupsUser?.loginId ?? '' })"
      :all="allGroups"
      :assigned-ids="assignedGroupIds"
      :saving="groupsSaving"
      @save="saveGroups"
    />
  </div>
</template>
