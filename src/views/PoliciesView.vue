<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Tag from 'primevue/tag'
import Message from 'primevue/message'
import { useToast } from 'primevue/usetoast'
import { policiesApi, type PolicyDescriptor, type PolicyTestResponse } from '@/api/policies'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const toast = useToast()
const { t } = useI18n()

const rows = ref<PolicyDescriptor[]>([])
const loading = ref(false)

const testOpen = ref(false)
const testTarget = ref<PolicyDescriptor | null>(null)
const testForm = ref({
  userId: auth.user?.id ?? '',
  tenantId: auth.user?.tenantId ?? 'default',
  subjectAttrs: '{}',
  action: '',
  resourceType: '',
  resourceId: '',
  resourceAttrs: '{}',
  environment: '{}',
})
const testResult = ref<PolicyTestResponse | null>(null)
const testRunning = ref(false)

const subjectAttrsValid = computed(() => safeParse(testForm.value.subjectAttrs).ok)
const resourceAttrsValid = computed(() => safeParse(testForm.value.resourceAttrs).ok)
const environmentValid = computed(() => safeParse(testForm.value.environment).ok)

const effectSeverity = (effect: PolicyTestResponse['effect']) =>
  effect === 'PERMIT' ? 'success' : effect === 'DENY' ? 'danger' : 'secondary'

async function reload() {
  loading.value = true
  try {
    rows.value = await policiesApi.list()
  } catch (e) {
    toast.add({ severity: 'error', summary: t('policies.toasts.loadFailed'), detail: msg(e), life: 4000 })
  } finally {
    loading.value = false
  }
}

function openTest(row: PolicyDescriptor) {
  testTarget.value = row
  testResult.value = null
  testOpen.value = true
}

async function runTest() {
  if (!testTarget.value) return
  if (!subjectAttrsValid.value || !resourceAttrsValid.value || !environmentValid.value) {
    toast.add({ severity: 'warn', summary: t('policies.testDialog.jsonInvalid'), life: 3000 })
    return
  }
  testRunning.value = true
  testResult.value = null
  try {
    testResult.value = await policiesApi.test({
      policyName: testTarget.value.name,
      subject: {
        userId: testForm.value.userId,
        tenantId: testForm.value.tenantId || undefined,
        attributes: safeParse(testForm.value.subjectAttrs).value,
      },
      action: testForm.value.action,
      resource: {
        type: testForm.value.resourceType,
        id: testForm.value.resourceId || undefined,
        attributes: safeParse(testForm.value.resourceAttrs).value,
      },
      environment: safeParse(testForm.value.environment).value,
    })
  } catch (e) {
    toast.add({ severity: 'error', summary: t('policies.toasts.testFailed'), detail: msg(e), life: 4000 })
  } finally {
    testRunning.value = false
  }
}

function safeParse(raw: string): { ok: boolean; value: Record<string, unknown> } {
  if (!raw || raw.trim() === '') return { ok: true, value: {} }
  try {
    const parsed = JSON.parse(raw)
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return { ok: true, value: parsed as Record<string, unknown> }
    }
    return { ok: false, value: {} }
  } catch {
    return { ok: false, value: {} }
  }
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
      <h1 class="text-xl font-semibold">{{ t('policies.title') }}</h1>
      <Button icon="pi pi-refresh" severity="secondary" outlined :aria-label="t('common.ariaRefresh')" @click="reload" />
    </div>

    <Message severity="info" :closable="false">
      {{ t('policies.intro') }}
    </Message>

    <DataTable
      :value="rows"
      :loading="loading"
      striped-rows
      paginator
      :rows="15"
      data-key="name"
    >
      <Column field="name" :header="t('policies.columns.name')" sortable />
      <Column field="description" :header="t('policies.columns.description')">
        <template #body="{ data }">
          <span class="text-surface-600 dark:text-surface-300">{{ data.description ?? '—' }}</span>
        </template>
      </Column>
      <Column header="" style="width: 8rem; text-align: right">
        <template #body="{ data }">
          <Button icon="pi pi-play" text rounded :aria-label="t('policies.ariaTest')" @click="openTest(data)" />
        </template>
      </Column>
    </DataTable>

    <Dialog v-model:visible="testOpen" :header="t('policies.testDialog.title')" modal :style="{ width: '36rem' }">
      <p class="text-sm text-surface-600 dark:text-surface-300 mb-3">
        {{ t('policies.testDialog.target', { name: testTarget?.name ?? '' }) }}
      </p>

      <div class="flex flex-col gap-3">
        <div class="grid grid-cols-2 gap-3">
          <InputText v-model="testForm.userId" :placeholder="t('policies.testDialog.userIdPlaceholder')" />
          <InputText v-model="testForm.tenantId" :placeholder="t('policies.testDialog.tenantIdPlaceholder')" />
        </div>
        <Textarea
          v-model="testForm.subjectAttrs"
          rows="3"
          :placeholder="t('policies.testDialog.subjectAttrsPlaceholder')"
          :class="{ 'p-invalid': !subjectAttrsValid }"
          auto-resize
        />
        <InputText v-model="testForm.action" :placeholder="t('policies.testDialog.actionPlaceholder')" />
        <div class="grid grid-cols-2 gap-3">
          <InputText v-model="testForm.resourceType" :placeholder="t('policies.testDialog.resourceTypePlaceholder')" />
          <InputText v-model="testForm.resourceId" :placeholder="t('policies.testDialog.resourceIdPlaceholder')" />
        </div>
        <Textarea
          v-model="testForm.resourceAttrs"
          rows="3"
          :placeholder="t('policies.testDialog.resourceAttrsPlaceholder')"
          :class="{ 'p-invalid': !resourceAttrsValid }"
          auto-resize
        />
        <Textarea
          v-model="testForm.environment"
          rows="2"
          :placeholder="t('policies.testDialog.environmentPlaceholder')"
          :class="{ 'p-invalid': !environmentValid }"
          auto-resize
        />
      </div>

      <div v-if="testResult" class="mt-4 p-3 rounded border border-surface-200 dark:border-surface-700">
        <div class="flex items-center gap-2 mb-2">
          <strong>{{ t('policies.testDialog.effect') }}:</strong>
          <Tag :value="testResult.effect" :severity="effectSeverity(testResult.effect)" />
        </div>
        <div class="text-sm">
          <div><strong>{{ t('policies.testDialog.reason') }}:</strong> {{ testResult.reason ?? '—' }}</div>
          <div class="mt-1">
            <strong>{{ t('policies.testDialog.matched') }}:</strong>
            <span v-if="testResult.matchedRules.length === 0">—</span>
            <ul v-else class="list-disc list-inside">
              <li v-for="r in testResult.matchedRules" :key="r">{{ r }}</li>
            </ul>
          </div>
        </div>
      </div>

      <template #footer>
        <Button :label="t('common.close')" text @click="testOpen = false" />
        <Button :label="t('policies.testDialog.run')" icon="pi pi-play" :loading="testRunning" @click="runTest" />
      </template>
    </Dialog>
  </div>
</template>
