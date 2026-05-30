<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
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
const { t } = useI18n()

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
    toast.add({ severity: 'error', summary: t('diagnostics.loginTest.failed'), detail: msg(e), life: 4000 })
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
    toast.add({ severity: 'error', summary: t('diagnostics.permCheck.failed'), detail: msg(e), life: 4000 })
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
    toast.add({ severity: 'error', summary: t('diagnostics.menuVis.failed'), detail: msg(e), life: 4000 })
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
    <h1 class="text-xl font-semibold">{{ t('diagnostics.title') }}</h1>

    <Message severity="info" :closable="false">
      {{ t('diagnostics.intro') }}
    </Message>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <template #title>{{ t('diagnostics.loginTest.title') }}</template>
        <template #content>
          <div class="flex flex-col gap-3">
            <InputText v-model="loginForm.tenantId" :placeholder="t('diagnostics.loginTest.tenantIdPlaceholder')" />
            <InputText v-model="loginForm.loginId" :placeholder="t('diagnostics.loginTest.loginIdPlaceholder')" />
            <Password v-model="loginForm.rawPassword" :feedback="false" toggle-mask fluid />
            <Button :label="t('diagnostics.loginTest.run')" icon="pi pi-play" :loading="loginRunning" @click="runLoginTest" />
            <div v-if="loginResult" class="mt-2 p-3 rounded border border-surface-200 dark:border-surface-700 text-sm">
              <div class="flex items-center gap-2 mb-2">
                <strong>{{ t('diagnostics.loginTest.result') }}:</strong>
                <Tag
                  :value="loginResult.success ? t('diagnostics.loginTest.ok') : t('diagnostics.loginTest.fail')"
                  :severity="loginResult.success ? 'success' : 'danger'"
                />
              </div>
              <div><strong>{{ t('diagnostics.loginTest.userId') }}:</strong> {{ loginResult.userId ?? '—' }}</div>
              <div><strong>{{ t('diagnostics.loginTest.status') }}:</strong> {{ loginResult.status ?? '—' }}</div>
              <div><strong>{{ t('diagnostics.loginTest.failureReason') }}:</strong> {{ loginResult.failureReason ?? '—' }}</div>
            </div>
          </div>
        </template>
      </Card>

      <Card>
        <template #title>{{ t('diagnostics.permCheck.title') }}</template>
        <template #content>
          <div class="flex flex-col gap-3">
            <InputText v-model="permForm.userId" :placeholder="t('diagnostics.permCheck.userIdPlaceholder')" />
            <InputText v-model="permForm.tenantId" :placeholder="t('diagnostics.permCheck.tenantIdPlaceholder')" />
            <InputText v-model="permForm.permissionCode" :placeholder="t('diagnostics.permCheck.permissionPlaceholder')" />
            <Button :label="t('diagnostics.permCheck.run')" icon="pi pi-play" :loading="permRunning" @click="runPermCheck" />
            <div v-if="permResult" class="mt-2 p-3 rounded border border-surface-200 dark:border-surface-700 text-sm">
              <div class="flex items-center gap-2 mb-2">
                <strong>{{ t('diagnostics.permCheck.hasPermission') }}:</strong>
                <Tag
                  :value="permResult.hasPermission ? t('diagnostics.permCheck.yes') : t('diagnostics.permCheck.no')"
                  :severity="permResult.hasPermission ? 'success' : 'danger'"
                />
              </div>
              <div>
                <strong>{{ t('diagnostics.permCheck.matchedVia') }}:</strong>
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
        <template #title>{{ t('diagnostics.menuVis.title') }}</template>
        <template #content>
          <div class="flex flex-col gap-3">
            <div class="grid grid-cols-2 gap-3">
              <InputText v-model="menuForm.userId" :placeholder="t('diagnostics.menuVis.userIdPlaceholder')" />
              <InputText v-model="menuForm.tenantId" :placeholder="t('diagnostics.menuVis.tenantIdPlaceholder')" />
            </div>
            <Button :label="t('diagnostics.menuVis.run')" icon="pi pi-play" :loading="menuRunning" @click="runMenuVisibility" />
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
