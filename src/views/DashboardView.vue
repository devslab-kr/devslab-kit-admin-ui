<script setup lang="ts">
import Card from 'primevue/card'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const kpis = [
  { label: 'Users', value: '—', icon: 'pi pi-user' },
  { label: 'Roles', value: '—', icon: 'pi pi-id-card' },
  { label: 'Permissions', value: '—', icon: 'pi pi-key' },
  { label: 'Active tenant', value: auth.user?.tenantId ?? '—', icon: 'pi pi-building' },
]
</script>

<template>
  <div class="flex flex-col gap-6">
    <h1 class="text-xl font-semibold">Dashboard</h1>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card v-for="k in kpis" :key="k.label">
        <template #content>
          <div class="flex items-center gap-3">
            <i :class="[k.icon, 'text-2xl text-primary']"></i>
            <div>
              <div class="text-sm text-surface-500 dark:text-surface-400">{{ k.label }}</div>
              <div class="text-2xl font-semibold">{{ k.value }}</div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <Card>
      <template #title>Welcome</template>
      <template #content>
        <p class="text-surface-700 dark:text-surface-300">
          이 admin console은 <strong>devslab-kit</strong>의 모든 기능을 시각적으로 관리하기 위한 UI입니다.
          KPI 값은 backend의 metrics endpoint가 준비되면 실제 값으로 채워집니다.
        </p>
      </template>
    </Card>
  </div>
</template>
