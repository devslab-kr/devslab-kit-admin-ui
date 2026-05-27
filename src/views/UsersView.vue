<script setup lang="ts">
import { onMounted, ref } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { usersApi, type UserAccount } from '@/api/users'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const toast = useToast()
const confirm = useConfirm()

const tenantId = ref(auth.user?.tenantId ?? 'default')
const rows = ref<UserAccount[]>([])
const loading = ref(false)

const createOpen = ref(false)
const passwordDialogOpen = ref(false)
const statusDialogOpen = ref(false)

const newUser = ref({ loginId: '', email: '', rawPassword: '', providerType: 'LOCAL' })
const passwordTarget = ref<UserAccount | null>(null)
const newPassword = ref('')
const statusTarget = ref<UserAccount | null>(null)
const newStatus = ref<UserAccount['status']>('ACTIVE')

const statusOptions = ['ACTIVE', 'LOCKED', 'DISABLED', 'PENDING_VERIFICATION']

const statusSeverity = (s: UserAccount['status']) =>
  s === 'ACTIVE' ? 'success' : s === 'LOCKED' ? 'warn' : s === 'DISABLED' ? 'danger' : 'info'

async function reload() {
  loading.value = true
  try {
    rows.value = await usersApi.list(tenantId.value)
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Failed to load users', detail: extractMsg(e), life: 4000 })
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
    toast.add({ severity: 'success', summary: 'User created', life: 2500 })
    createOpen.value = false
    await reload()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Create failed', detail: extractMsg(e), life: 4000 })
  }
}

async function toggleLock(row: UserAccount) {
  try {
    if (row.locked) await usersApi.unlock(row.id.value)
    else await usersApi.lock(row.id.value)
    await reload()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Lock/unlock failed', detail: extractMsg(e), life: 4000 })
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
    toast.add({ severity: 'success', summary: 'Password reset', life: 2500 })
    passwordDialogOpen.value = false
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Password reset failed', detail: extractMsg(e), life: 4000 })
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
    toast.add({ severity: 'success', summary: 'Status updated', life: 2500 })
    statusDialogOpen.value = false
    await reload()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Status update failed', detail: extractMsg(e), life: 4000 })
  }
}

function confirmDelete(row: UserAccount) {
  confirm.require({
    message: `Delete user "${row.loginId}"? This cannot be undone.`,
    header: 'Delete user',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await usersApi.remove(row.id.value)
        toast.add({ severity: 'success', summary: 'User deleted', life: 2500 })
        await reload()
      } catch (e) {
        toast.add({ severity: 'error', summary: 'Delete failed', detail: extractMsg(e), life: 4000 })
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
      <h1 class="text-xl font-semibold">Users</h1>
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
      :rows-per-page-options="[10, 25, 50]"
      data-key="id.value"
    >
      <Column field="loginId" header="Login ID" sortable />
      <Column field="email" header="Email" />
      <Column header="Status" sortable>
        <template #body="{ data }">
          <Tag :value="data.status" :severity="statusSeverity(data.status)" />
        </template>
      </Column>
      <Column header="Locked">
        <template #body="{ data }">
          <i :class="['pi', data.locked ? 'pi-lock text-orange-500' : 'pi-lock-open text-green-500']"></i>
        </template>
      </Column>
      <Column field="providerType" header="Provider" />
      <Column header="" style="width: 14rem; text-align: right">
        <template #body="{ data }">
          <div class="flex items-center justify-end gap-1">
            <Button
              :icon="data.locked ? 'pi pi-lock-open' : 'pi pi-lock'"
              :severity="data.locked ? 'success' : 'warn'"
              text
              rounded
              :aria-label="data.locked ? 'Unlock' : 'Lock'"
              @click="toggleLock(data)"
            />
            <Button icon="pi pi-key" text rounded aria-label="Reset password" @click="openPassword(data)" />
            <Button icon="pi pi-pencil" text rounded aria-label="Change status" @click="openStatus(data)" />
            <Button
              icon="pi pi-trash"
              text
              rounded
              severity="danger"
              aria-label="Delete"
              @click="confirmDelete(data)"
            />
          </div>
        </template>
      </Column>
    </DataTable>

    <Dialog v-model:visible="createOpen" header="Create user" modal :style="{ width: '28rem' }">
      <div class="flex flex-col gap-3 pt-2">
        <InputText v-model="newUser.loginId" placeholder="Login ID" />
        <InputText v-model="newUser.email" placeholder="Email (optional)" />
        <Password
          v-model="newUser.rawPassword"
          placeholder="Password (min 8)"
          :feedback="false"
          toggle-mask
          fluid
        />
        <InputText v-model="newUser.providerType" placeholder="Provider (default LOCAL)" />
      </div>
      <template #footer>
        <Button label="Cancel" text @click="createOpen = false" />
        <Button label="Create" icon="pi pi-check" @click="submitCreate" />
      </template>
    </Dialog>

    <Dialog v-model:visible="passwordDialogOpen" header="Reset password" modal :style="{ width: '24rem' }">
      <p class="text-sm text-surface-600 dark:text-surface-300 mb-2">
        New password for <strong>{{ passwordTarget?.loginId }}</strong>
      </p>
      <Password v-model="newPassword" :feedback="false" toggle-mask fluid />
      <template #footer>
        <Button label="Cancel" text @click="passwordDialogOpen = false" />
        <Button label="Reset" icon="pi pi-check" @click="submitPassword" />
      </template>
    </Dialog>

    <Dialog v-model:visible="statusDialogOpen" header="Change status" modal :style="{ width: '24rem' }">
      <p class="text-sm text-surface-600 dark:text-surface-300 mb-2">
        Status for <strong>{{ statusTarget?.loginId }}</strong>
      </p>
      <Select v-model="newStatus" :options="statusOptions" fluid />
      <template #footer>
        <Button label="Cancel" text @click="statusDialogOpen = false" />
        <Button label="Save" icon="pi pi-check" @click="submitStatus" />
      </template>
    </Dialog>
  </div>
</template>
