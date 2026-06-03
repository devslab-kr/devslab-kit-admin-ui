<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import Tree from 'primevue/tree'
import type { TreeNode } from 'primevue/treenode'
import Message from 'primevue/message'
import { useToast } from 'primevue/usetoast'
import {
  diagnosticsApi,
  type LoginTestResponse,
  type PermissionCheckResponse,
  type MenuVisibilityResponse,
} from '@/api/diagnostics'
import { usersApi, type UserAccount } from '@/api/users'
import { permissionsApi, type Permission } from '@/api/permissions'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const toast = useToast()
const { t } = useI18n()

const tenantId = auth.user?.tenantId ?? 'default'

// Pickers — so you choose a user by login id / a permission by code instead of
// hand-typing UUIDs and permission codes.
const users = ref<UserAccount[]>([])
const permissions = ref<Permission[]>([])

const userOptions = computed(() => users.value.map((u) => ({ label: u.loginId, value: u.id.value })))
const permissionOptions = computed(() => permissions.value.map((p) => ({ label: p.code, value: p.code })))

async function loadPickers() {
  try {
    const [u, p] = await Promise.all([usersApi.list(tenantId), permissionsApi.list()])
    users.value = u
    permissions.value = p
  } catch {
    // Pickers are a convenience; failing to load them shouldn't break the page.
  }
}

// --- Login test (type credentials on purpose) ---
const loginForm = ref({ tenantId, loginId: '', rawPassword: '' })
const loginResult = ref<LoginTestResponse | null>(null)
const loginRunning = ref(false)

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

// --- Permission check (pick user + permission) ---
const permForm = ref({ userId: auth.user?.id ?? '', permissionCode: '' })
const permResult = ref<PermissionCheckResponse | null>(null)
const permRunning = ref(false)

async function runPermCheck() {
  permRunning.value = true
  permResult.value = null
  try {
    permResult.value = await diagnosticsApi.permissionCheck({
      userId: permForm.value.userId,
      permissionCode: permForm.value.permissionCode,
    })
  } catch (e) {
    toast.add({ severity: 'error', summary: t('diagnostics.permCheck.failed'), detail: msg(e), life: 4000 })
  } finally {
    permRunning.value = false
  }
}

// --- Menu visibility (pick user, render as a tree) ---
const menuForm = ref({ userId: auth.user?.id ?? '' })
const menuResult = ref<MenuVisibilityResponse | null>(null)
const menuRunning = ref(false)

const menuTree = computed<TreeNode[]>(() => toNodes(menuResult.value?.items ?? []))
function toNodes(items: MenuVisibilityResponse['items']): TreeNode[] {
  return items.map((it) => ({
    key: it.id,
    label: it.label,
    data: it,
    children: it.children?.length ? toNodes(it.children) : undefined,
  }))
}

async function runMenuVisibility() {
  menuRunning.value = true
  menuResult.value = null
  try {
    menuResult.value = await diagnosticsApi.menuVisibility(menuForm.value.userId)
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

onMounted(loadPickers)
</script>

<template>
  <div class="flex flex-col gap-4">
    <h1 class="text-2xl font-semibold">{{ t('diagnostics.title') }}</h1>

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
            <Select
              v-model="permForm.userId"
              :options="userOptions"
              option-label="label"
              option-value="value"
              filter
              show-clear
              class="w-full"
              :placeholder="t('diagnostics.permCheck.userSelect')"
            />
            <Select
              v-model="permForm.permissionCode"
              :options="permissionOptions"
              option-label="label"
              option-value="value"
              filter
              show-clear
              class="w-full"
              :placeholder="t('diagnostics.permCheck.permissionSelect')"
            />
            <Button
              :label="t('diagnostics.permCheck.run')"
              icon="pi pi-play"
              :loading="permRunning"
              :disabled="!permForm.userId || !permForm.permissionCode"
              @click="runPermCheck"
            />
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
            <div class="flex flex-col sm:flex-row gap-3 sm:items-center">
              <Select
                v-model="menuForm.userId"
                :options="userOptions"
                option-label="label"
                option-value="value"
                filter
                show-clear
                class="w-full sm:w-80"
                :placeholder="t('diagnostics.menuVis.userSelect')"
              />
              <Button
                :label="t('diagnostics.menuVis.run')"
                icon="pi pi-play"
                :loading="menuRunning"
                :disabled="!menuForm.userId"
                @click="runMenuVisibility"
              />
            </div>

            <div
              v-if="menuResult && menuTree.length === 0"
              class="text-sm text-surface-500 p-3 rounded border border-surface-200 dark:border-surface-700"
            >
              {{ t('diagnostics.menuVis.empty') }}
            </div>
            <Tree
              v-else-if="menuResult"
              :value="menuTree"
              class="mt-1 border border-surface-200 dark:border-surface-700 rounded-md"
            >
              <template #default="{ node }">
                <span class="inline-flex items-center gap-2">
                  <Tag
                    :value="node.data.visible ? t('diagnostics.menuVis.visible') : t('diagnostics.menuVis.hidden')"
                    :severity="node.data.visible ? 'success' : 'secondary'"
                    style="min-width: 3.5rem; justify-content: center"
                  />
                  <span :class="node.data.visible ? '' : 'text-surface-400 line-through'">{{ node.label }}</span>
                  <code v-if="node.data.requiredPermission" class="text-xs text-surface-400">
                    {{ node.data.requiredPermission }}
                  </code>
                </span>
              </template>
            </Tree>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>
