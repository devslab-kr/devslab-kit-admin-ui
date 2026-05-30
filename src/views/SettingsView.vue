<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Card from 'primevue/card'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Message from 'primevue/message'
import { useToast } from 'primevue/usetoast'
import { settingsApi, type AdminSettings } from '@/api/settings'

const toast = useToast()
const { t } = useI18n()

const data = ref<AdminSettings | null>(null)
const loading = ref(false)

async function reload() {
  loading.value = true
  try {
    data.value = await settingsApi.get()
  } catch (e) {
    toast.add({ severity: 'error', summary: t('settings.toasts.loadFailed'), detail: msg(e), life: 4000 })
  } finally {
    loading.value = false
  }
}

function rawRows() {
  if (!data.value?.raw) return []
  return Object.entries(data.value.raw).map(([key, value]) => ({ key, value }))
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
      <h1 class="text-xl font-semibold">{{ t('settings.title') }}</h1>
      <Button
        icon="pi pi-refresh"
        severity="secondary"
        outlined
        :loading="loading"
        :aria-label="t('common.ariaRefresh')"
        @click="reload"
      />
    </div>

    <Message severity="info" :closable="false">
      {{ t('settings.intro') }}
    </Message>

    <div v-if="data" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <template #title>{{ t('settings.sections.jwt') }}</template>
        <template #content>
          <dl class="text-sm space-y-1">
            <div>
              <dt class="inline font-medium">{{ t('settings.fields.issuer') }}:</dt>
              <dd class="inline">{{ data.jwt.issuer }}</dd>
            </div>
            <div>
              <dt class="inline font-medium">{{ t('settings.fields.ttlSeconds') }}:</dt>
              <dd class="inline">{{ data.jwt.ttlSeconds }}</dd>
            </div>
            <div>
              <dt class="inline font-medium">{{ t('settings.fields.secret') }}:</dt>
              <dd class="inline"><code>{{ data.jwt.secretMasked }}</code></dd>
            </div>
          </dl>
        </template>
      </Card>

      <Card>
        <template #title>{{ t('settings.sections.tenant') }}</template>
        <template #content>
          <p class="text-sm"><code>{{ data.tenant.resolver }}</code></p>
        </template>
      </Card>

      <Card>
        <template #title>{{ t('settings.sections.identity') }}</template>
        <template #content>
          <dl class="text-sm space-y-1">
            <div>
              <dt class="inline font-medium">{{ t('settings.fields.lockoutThreshold') }}:</dt>
              <dd class="inline">
                {{ t('settings.fields.lockoutThresholdValue', { n: data.identity.lockoutThreshold }) }}
              </dd>
            </div>
            <div>
              <dt class="inline font-medium">{{ t('settings.fields.lockoutDurationSeconds') }}:</dt>
              <dd class="inline">{{ data.identity.lockoutDurationSeconds }} s</dd>
            </div>
          </dl>
        </template>
      </Card>

      <Card>
        <template #title>{{ t('settings.sections.audit') }}</template>
        <template #content>
          <dl class="text-sm space-y-1">
            <div>
              <dt class="inline font-medium">{{ t('settings.fields.enabled') }}:</dt>
              <dd class="inline">{{ data.audit.enabled ? t('settings.yes') : t('settings.no') }}</dd>
            </div>
            <div>
              <dt class="inline font-medium">{{ t('settings.fields.asyncQueueCapacity') }}:</dt>
              <dd class="inline">{{ data.audit.asyncQueueCapacity }}</dd>
            </div>
          </dl>
        </template>
      </Card>

      <Card>
        <template #title>{{ t('settings.sections.menu') }}</template>
        <template #content>
          <dl class="text-sm space-y-1">
            <div>
              <dt class="inline font-medium">{{ t('settings.fields.cacheTtlSeconds') }}:</dt>
              <dd class="inline">{{ data.menu.cacheTtlSeconds }}</dd>
            </div>
          </dl>
        </template>
      </Card>

      <Card class="lg:col-span-2">
        <template #title>{{ t('settings.sections.raw') }}</template>
        <template #content>
          <DataTable :value="rawRows()" striped-rows paginator :rows="20" data-key="key">
            <Column field="key" :header="t('settings.rawKey')" sortable style="width: 24rem" />
            <Column field="value" :header="t('settings.rawValue')">
              <template #body="{ data: row }">
                <code class="text-xs">{{ row.value }}</code>
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>
    </div>
  </div>
</template>
