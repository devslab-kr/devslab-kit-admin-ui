<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import Checkbox from 'primevue/checkbox'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth'
import { configSyncApi, type ConfigBundle, type ImportResult, type ImportSection } from '@/api/configSync'

const toast = useToast()
const { t } = useI18n()
const auth = useAuthStore()

// ── Export ────────────────────────────────────────────────────────────────
const exported = ref<ConfigBundle | null>(null)
const exportedJson = ref('')
const exporting = ref(false)
const exportIncludeUsers = ref(false)

async function runExport() {
  exporting.value = true
  try {
    const tenantId = auth.user?.tenantId ?? 'default'
    const bundle = await configSyncApi.export(tenantId, exportIncludeUsers.value)
    exported.value = bundle
    exportedJson.value = JSON.stringify(bundle, null, 2)
    toast.add({ severity: 'success', summary: t('configSync.toasts.exported'), life: 3000 })
  } catch (e) {
    toast.add({ severity: 'error', summary: t('configSync.toasts.exportFailed'), detail: msg(e), life: 6000 })
  } finally {
    exporting.value = false
  }
}

function downloadExport() {
  if (!exported.value) return
  const blob = new Blob([exportedJson.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `config-bundle-${exported.value.tenantId}.json`
  a.click()
  URL.revokeObjectURL(url)
}

async function copyExport() {
  if (!exportedJson.value) return
  try {
    await navigator.clipboard.writeText(exportedJson.value)
    toast.add({ severity: 'success', summary: t('configSync.toasts.copied'), life: 2000 })
  } catch {
    toast.add({ severity: 'warn', summary: t('configSync.toasts.copyFailed'), life: 3000 })
  }
}

// ── Import ────────────────────────────────────────────────────────────────
const importText = ref('')
const mode = ref<'merge' | 'mirror'>('merge')
const modeOptions = computed(() => [
  { label: t('configSync.import.modes.merge'), value: 'merge' },
  { label: t('configSync.import.modes.mirror'), value: 'mirror' },
])
const importIncludeUsers = ref(false)
const result = ref<ImportResult | null>(null)
const importing = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

// Any edit to the bundle text, mode or the users toggle invalidates a prior
// dry-run: "Apply" is gated on a fresh preview matching exactly what will run.
watch([importText, mode, importIncludeUsers], () => {
  result.value = null
})

function pickFile() {
  fileInput.value?.click()
}
function onFileChosen(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    importText.value = String(reader.result ?? '')
  }
  reader.readAsText(file)
  input.value = '' // allow re-picking the same file
}

function parseBundle(): ConfigBundle | null {
  try {
    return JSON.parse(importText.value) as ConfigBundle
  } catch {
    toast.add({ severity: 'error', summary: t('configSync.import.invalidJson'), life: 4000 })
    return null
  }
}

async function runDryRun() {
  const bundle = parseBundle()
  if (!bundle) return
  importing.value = true
  try {
    result.value = await configSyncApi.apply(bundle, true, mode.value, importIncludeUsers.value)
    toast.add({ severity: 'info', summary: t('configSync.toasts.dryRunDone'), life: 3000 })
  } catch (e) {
    result.value = null
    toast.add({ severity: 'error', summary: t('configSync.toasts.importFailed'), detail: msg(e), life: 6000 })
  } finally {
    importing.value = false
  }
}

async function runApply() {
  const bundle = parseBundle()
  if (!bundle) return
  importing.value = true
  try {
    result.value = await configSyncApi.apply(bundle, false, mode.value, importIncludeUsers.value)
    toast.add({ severity: 'success', summary: t('configSync.toasts.applied'), life: 4000 })
  } catch (e) {
    toast.add({ severity: 'error', summary: t('configSync.toasts.importFailed'), detail: msg(e), life: 6000 })
  } finally {
    importing.value = false
  }
}

// A dry-run must precede apply, and it must reflect the current text (the watch
// above clears `result` on any edit, so a present result is always fresh).
const canApply = computed(() => result.value?.dryRun === true && !importing.value)

function hasAny(s: ImportSection) {
  return s.created.length + s.updated.length + s.deleted.length + s.skipped.length > 0
}

const sections = computed(() => {
  const r = result.value
  if (!r) return []
  const list = [
    { key: 'permissions', label: t('configSync.result.section.permissions'), data: r.permissions },
    { key: 'roles', label: t('configSync.result.section.roles'), data: r.roles },
    { key: 'menus', label: t('configSync.result.section.menus'), data: r.menus },
  ]
  // Only surface the users section when user sync actually ran or produced something.
  if (importIncludeUsers.value || hasAny(r.users)) {
    list.push({ key: 'users', label: t('configSync.result.section.users'), data: r.users })
  }
  return list
})

// Mirror is the only mode that deletes; show the deleted block when relevant.
const showDeletes = computed(() => result.value?.mode === 'mirror')

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
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold">{{ t('configSync.title') }}</h1>
    </div>

    <Message severity="info" :closable="false">
      {{ t('configSync.intro') }}
    </Message>

    <!-- Export: snapshot this environment's definitional config as a code-keyed bundle. -->
    <Card>
      <template #title>
        <span class="flex items-center gap-2"><i class="pi pi-download" />{{ t('configSync.export.title') }}</span>
      </template>
      <template #content>
        <p class="text-sm text-surface-600 dark:text-surface-400 mb-3">{{ t('configSync.export.desc') }}</p>
        <div class="flex items-center gap-2 mb-3">
          <Checkbox v-model="exportIncludeUsers" binary input-id="exportIncludeUsers" />
          <label for="exportIncludeUsers" class="text-sm cursor-pointer">
            {{ t('configSync.export.includeUsers') }}
          </label>
        </div>
        <div class="flex flex-wrap items-center gap-2 mb-3">
          <Button :label="t('configSync.export.run')" icon="pi pi-download" :loading="exporting" @click="runExport" />
          <Button
            :label="t('configSync.export.download')"
            icon="pi pi-file-export"
            severity="secondary"
            outlined
            :disabled="!exported"
            @click="downloadExport"
          />
          <Button
            :label="t('configSync.export.copy')"
            icon="pi pi-copy"
            severity="secondary"
            outlined
            :disabled="!exported"
            @click="copyExport"
          />
          <span v-if="exported" class="flex flex-wrap items-center gap-2 text-sm">
            <Tag severity="info" :value="t('configSync.counts.permissions', { n: exported.permissions.length })" />
            <Tag severity="info" :value="t('configSync.counts.roles', { n: exported.roles.length })" />
            <Tag severity="info" :value="t('configSync.counts.menus', { n: exported.menus.length })" />
            <Tag
              v-if="exported.users"
              severity="info"
              :value="t('configSync.counts.users', { n: exported.users.length })"
            />
          </span>
        </div>
        <Textarea
          v-if="exported"
          :model-value="exportedJson"
          readonly
          :rows="14"
          class="w-full font-mono text-xs"
          spellcheck="false"
        />
        <p v-else class="text-sm text-surface-500">{{ t('configSync.export.empty') }}</p>
      </template>
    </Card>

    <!-- Import: paste/upload a bundle, preview the diff (dry-run), then apply. -->
    <Card>
      <template #title>
        <span class="flex items-center gap-2"><i class="pi pi-upload" />{{ t('configSync.import.title') }}</span>
      </template>
      <template #content>
        <p class="text-sm text-surface-600 dark:text-surface-400 mb-3">{{ t('configSync.import.desc') }}</p>

        <div class="flex flex-wrap items-end gap-3 mb-3">
          <div class="flex flex-col gap-1">
            <label class="text-xs font-medium text-surface-600 dark:text-surface-400">
              {{ t('configSync.import.mode') }}
            </label>
            <Select v-model="mode" :options="modeOptions" option-label="label" option-value="value" class="w-48" />
          </div>
          <Button
            :label="t('configSync.import.pickFile')"
            icon="pi pi-folder-open"
            severity="secondary"
            outlined
            @click="pickFile"
          />
          <input ref="fileInput" type="file" accept="application/json,.json" class="hidden" @change="onFileChosen" />
          <div class="flex items-center gap-2 pb-1">
            <Checkbox v-model="importIncludeUsers" binary input-id="importIncludeUsers" />
            <label for="importIncludeUsers" class="text-sm cursor-pointer">
              {{ t('configSync.import.includeUsers') }}
            </label>
          </div>
        </div>

        <Message v-if="mode === 'mirror'" severity="warn" :closable="false" class="mb-3">
          {{ t('configSync.import.mirrorWarn') }}
        </Message>
        <Message v-if="importIncludeUsers" severity="info" :closable="false" class="mb-3">
          {{ t('configSync.import.usersHint') }}
        </Message>

        <Textarea
          v-model="importText"
          :rows="12"
          class="w-full font-mono text-xs"
          spellcheck="false"
          :placeholder="t('configSync.import.placeholder')"
        />

        <div class="flex flex-wrap items-center gap-2 mt-3">
          <Button
            :label="t('configSync.import.dryRun')"
            icon="pi pi-eye"
            severity="secondary"
            :loading="importing"
            :disabled="!importText.trim()"
            @click="runDryRun"
          />
          <Button
            :label="t('configSync.import.apply')"
            icon="pi pi-check"
            severity="danger"
            :loading="importing"
            :disabled="!canApply"
            @click="runApply"
          />
          <span v-if="!canApply && importText.trim()" class="text-xs text-surface-500">
            {{ t('configSync.import.needDryRun') }}
          </span>
        </div>
      </template>
    </Card>

    <!-- Result: the dry-run / applied diff, per section. Big and readable. -->
    <Card v-if="result">
      <template #title>
        <span class="flex items-center gap-2">
          <i :class="result.dryRun ? 'pi pi-eye text-primary' : 'pi pi-check-circle text-green-500'" />
          {{ result.dryRun ? t('configSync.result.dryRunTitle') : t('configSync.result.appliedTitle') }}
          <Tag :severity="result.dryRun ? 'info' : 'success'" :value="result.mode" />
        </span>
      </template>
      <template #content>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div v-for="s in sections" :key="s.key" class="border border-surface-200 dark:border-surface-800 rounded-lg p-4">
            <div class="font-semibold mb-3 flex items-center justify-between">
              <span>{{ s.label }}</span>
              <span class="text-xs font-normal text-surface-500">
                +{{ s.data.created.length }} / ~{{ s.data.updated.length
                }}<template v-if="showDeletes"> / −{{ s.data.deleted.length }}</template>
              </span>
            </div>

            <div class="mb-3">
              <div class="text-xs font-medium text-green-600 dark:text-green-400 mb-1">
                {{ t('configSync.result.created') }} ({{ s.data.created.length }})
              </div>
              <div v-if="s.data.created.length" class="flex flex-wrap gap-1">
                <Tag v-for="code in s.data.created" :key="code" severity="success" :value="code" />
              </div>
              <div v-else class="text-xs text-surface-400">{{ t('configSync.result.none') }}</div>
            </div>

            <div class="mb-3">
              <div class="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                {{ t('configSync.result.updated') }} ({{ s.data.updated.length }})
              </div>
              <div v-if="s.data.updated.length" class="flex flex-wrap gap-1">
                <Tag v-for="code in s.data.updated" :key="code" severity="info" :value="code" />
              </div>
              <div v-else class="text-xs text-surface-400">{{ t('configSync.result.none') }}</div>
            </div>

            <div v-if="showDeletes" class="mb-3">
              <div class="text-xs font-medium text-red-600 dark:text-red-400 mb-1">
                {{ t('configSync.result.deleted') }} ({{ s.data.deleted.length }})
              </div>
              <div v-if="s.data.deleted.length" class="flex flex-wrap gap-1">
                <Tag v-for="code in s.data.deleted" :key="code" severity="danger" :value="code" />
              </div>
              <div v-else class="text-xs text-surface-400">{{ t('configSync.result.none') }}</div>
            </div>

            <div v-if="s.data.skipped.length">
              <div class="text-xs font-medium text-surface-500 mb-1">
                {{ t('configSync.result.skipped') }} ({{ s.data.skipped.length }})
              </div>
              <div class="flex flex-wrap gap-1">
                <Tag v-for="code in s.data.skipped" :key="code" severity="secondary" :value="code" />
              </div>
            </div>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>
