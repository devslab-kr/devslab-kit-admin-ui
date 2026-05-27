<script setup lang="ts">
import { ref } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Tag from 'primevue/tag'
import Message from 'primevue/message'
import { useToast } from 'primevue/usetoast'
import {
  diagnosticsApi,
  type LoginTestResponse,
  type PermissionCheckResponse,
  type MenuVisibilityResponse,
} from '@/api/diagnostics'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const toast = useToast()

const loginForm = ref({
  tenantId: auth.user?.tenantId ?? 'default',
  loginId: '',
  rawPassword: '',
})
const loginResult = ref<LoginTestResponse | null>(null)
const loginRunning = ref(false)

const permForm = ref({
  userId: auth.user?.id ?? '',
  tenantId: auth.user?.tenantId ?? 'default',
  permissionCode: '',
})
const permResult = ref<PermissionCheckResponse | null>(null)
const permRunning = ref(false)

const menuForm = ref({
  userId: auth.user?.id ?? '',
  tenantId: auth.user?.tenantId ?? 'default',
})
const menuResult = ref<MenuVisibilityResponse | null>(null)
const menuRunning = ref(false)

async function runLoginTest() {
  loginRunning.value = true
  loginResult.value = null
  try {
    loginResult.value = await diagnosticsApi.loginTest(loginForm.value)
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Login test failed', detail: msg(e), life: 4000 })
  } finally {
    loginRunning.value = false
  }
}

async function runPermCheck() {
  permRunning.value = true
  permResult.value = null
  try {
    permResult.value = await diagnosticsApi.permissionCheck({
      userId: permForm.value.userId,
      permissionCode: permForm.value.permissionCode,
      tenantId: permForm.value.tenantId || undefined,
    })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Permission check failed', detail: msg(e), life: 4000 })
  } finally {
    permRunning.value = false
  }
}

async function runMenuVisibility() {
  menuRunning.value = true
  menuResult.value = null
  try {
    menuResult.value = await diagnosticsApi.menuVisibility(menuForm.value.userId, menuForm.value.tenantId)
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Menu visibility failed', detail: msg(e), life: 4000 })
  } finally {
    menuRunning.value = false
  }
}

function msg(e: unknown): string {
  if (e && typeof e === 'object' && 'response' in e) {
    const r = (e as { response?: { data?: { message?: string } } }).response
    return r?.data?.message ?? String(e)
  }
  return String(e)
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <h1 class="text-xl font-semibold">Diagnostics</h1>

    <Message severity="info" :closable="false">
      Read-only probes for verifying identity, access and menu wiring. No side effects — no audit log entry is written.
    </Message>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <template #title>Login test</template>
        <template #content>
          <div class="flex flex-col gap-3">
            <InputText v-model="loginForm.tenantId" placeholder="tenantId" />
            <InputText v-model="loginForm.loginId" placeholder="Login ID" />
            <Password v-model="loginForm.rawPassword" :feedback="false" toggle-mask fluid />
            <Button label="Run" icon="pi pi-play" :loading="loginRunning" @click="runLoginTest" />
            <div v-if="loginResult" class="mt-2 p-3 rounded border border-surface-200 dark:border-surface-700 text-sm">
              <div class="flex items-center gap-2 mb-2">
                <strong>Result:</strong>
                <Tag
                  :value="loginResult.success ? 'OK' : 'FAIL'"
                  :severity="loginResult.success ? 'success' : 'danger'"
                />
              </div>
              <div><strong>User id:</strong> {{ loginResult.userId ?? '—' }}</div>
              <div><strong>Status:</strong> {{ loginResult.status ?? '—' }}</div>
              <div><strong>Failure reason:</strong> {{ loginResult.failureReason ?? '—' }}</div>
            </div>
          </div>
        </template>
      </Card>

      <Card>
        <template #title>Permission check</template>
        <template #content>
          <div class="flex flex-col gap-3">
            <InputText v-model="permForm.userId" placeholder="User id" />
            <InputText v-model="permForm.tenantId" placeholder="tenantId (optional)" />
            <InputText v-model="permForm.permissionCode" placeholder="Permission code (e.g. admin.user.read)" />
            <Button label="Run" icon="pi pi-play" :loading="permRunning" @click="runPermCheck" />
            <div v-if="permResult" class="mt-2 p-3 rounded border border-surface-200 dark:border-surface-700 text-sm">
              <div class="flex items-center gap-2 mb-2">
                <strong>Has permission:</strong>
                <Tag
                  :value="permResult.hasPermission ? 'YES' : 'NO'"
                  :severity="permResult.hasPermission ? 'success' : 'danger'"
                />
              </div>
              <div>
                <strong>Matched via:</strong>
                <span v-if="permResult.matchedVia.length === 0">—</span>
                <ul v-else class="list-disc list-inside">
                  <li v-for="m in permResult.matchedVia" :key="m">{{ m }}</li>
                </ul>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <Card class="lg:col-span-2">
        <template #title>Menu visibility</template>
        <template #content>
          <div class="flex flex-col gap-3">
            <div class="grid grid-cols-2 gap-3">
              <InputText v-model="menuForm.userId" placeholder="User id" />
              <InputText v-model="menuForm.tenantId" placeholder="tenantId" />
            </div>
            <Button label="Run" icon="pi pi-play" :loading="menuRunning" @click="runMenuVisibility" />
            <pre
              v-if="menuResult"
              class="mt-2 p-3 rounded bg-surface-100 dark:bg-surface-800 overflow-auto text-xs max-h-96"
            >{{ JSON.stringify(menuResult, null, 2) }}</pre>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>
