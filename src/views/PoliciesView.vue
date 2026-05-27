<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
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
    toast.add({ severity: 'error', summary: 'Failed to load policies', detail: msg(e), life: 4000 })
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
    toast.add({ severity: 'warn', summary: 'Fix the JSON inputs first', life: 3000 })
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
    toast.add({ severity: 'error', summary: 'Policy test failed', detail: msg(e), life: 4000 })
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
      <h1 class="text-xl font-semibold">Policies (ABAC)</h1>
      <Button icon="pi pi-refresh" severity="secondary" outlined @click="reload" />
    </div>

    <Message severity="info" :closable="false">
      These are the policies registered with the ABAC <code>PolicyEvaluator</code>.
      Use <strong>Test</strong> to dry-run a (subject, action, resource) tuple without persisting anything.
    </Message>

    <DataTable
      :value="rows"
      :loading="loading"
      striped-rows
      paginator
      :rows="15"
      data-key="name"
    >
      <Column field="name" header="Name" sortable />
      <Column field="description" header="Description">
        <template #body="{ data }">
          <span class="text-surface-600 dark:text-surface-300">{{ data.description ?? '—' }}</span>
        </template>
      </Column>
      <Column header="" style="width: 8rem; text-align: right">
        <template #body="{ data }">
          <Button icon="pi pi-play" text rounded aria-label="Test" @click="openTest(data)" />
        </template>
      </Column>
    </DataTable>

    <Dialog v-model:visible="testOpen" header="Test policy (dry-run)" modal :style="{ width: '36rem' }">
      <p class="text-sm text-surface-600 dark:text-surface-300 mb-3">
        Evaluating <strong>{{ testTarget?.name }}</strong>
      </p>

      <div class="flex flex-col gap-3">
        <div class="grid grid-cols-2 gap-3">
          <InputText v-model="testForm.userId" placeholder="Subject userId" />
          <InputText v-model="testForm.tenantId" placeholder="Subject tenantId" />
        </div>
        <Textarea
          v-model="testForm.subjectAttrs"
          rows="3"
          placeholder='Subject attributes (JSON, e.g. {"role":"admin"})'
          :class="{ 'p-invalid': !subjectAttrsValid }"
          auto-resize
        />
        <InputText v-model="testForm.action" placeholder="Action (e.g. read, write)" />
        <div class="grid grid-cols-2 gap-3">
          <InputText v-model="testForm.resourceType" placeholder="Resource type" />
          <InputText v-model="testForm.resourceId" placeholder="Resource id (optional)" />
        </div>
        <Textarea
          v-model="testForm.resourceAttrs"
          rows="3"
          placeholder='Resource attributes (JSON)'
          :class="{ 'p-invalid': !resourceAttrsValid }"
          auto-resize
        />
        <Textarea
          v-model="testForm.environment"
          rows="2"
          placeholder='Environment attributes (JSON)'
          :class="{ 'p-invalid': !environmentValid }"
          auto-resize
        />
      </div>

      <div v-if="testResult" class="mt-4 p-3 rounded border border-surface-200 dark:border-surface-700">
        <div class="flex items-center gap-2 mb-2">
          <strong>Effect:</strong>
          <Tag :value="testResult.effect" :severity="effectSeverity(testResult.effect)" />
        </div>
        <div class="text-sm">
          <div><strong>Reason:</strong> {{ testResult.reason ?? '—' }}</div>
          <div class="mt-1">
            <strong>Matched rules:</strong>
            <span v-if="testResult.matchedRules.length === 0">—</span>
            <ul v-else class="list-disc list-inside">
              <li v-for="r in testResult.matchedRules" :key="r">{{ r }}</li>
            </ul>
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Close" text @click="testOpen = false" />
        <Button label="Run test" icon="pi pi-play" :loading="testRunning" @click="runTest" />
      </template>
    </Dialog>
  </div>
</template>
