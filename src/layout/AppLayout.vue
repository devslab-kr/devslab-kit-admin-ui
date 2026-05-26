<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute, RouterView } from 'vue-router'
import Menu from 'primevue/menu'
import Button from 'primevue/button'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const ui = useUiStore()

const navGroups = [
  {
    label: 'Identity & Access',
    items: [
      { label: 'Users', icon: 'pi pi-user', route: 'users' },
      { label: 'Roles', icon: 'pi pi-id-card', route: 'roles' },
      { label: 'Permissions', icon: 'pi pi-key', route: 'permissions' },
      { label: 'Groups', icon: 'pi pi-users', route: 'groups' },
    ],
  },
  {
    label: 'Platform',
    items: [
      { label: 'Menus', icon: 'pi pi-list', route: 'menus' },
      { label: 'Tenants', icon: 'pi pi-building', route: 'tenants' },
      { label: 'Policies', icon: 'pi pi-shield', route: 'policies' },
      { label: 'Settings', icon: 'pi pi-cog', route: 'settings' },
    ],
  },
  {
    label: 'Observability',
    items: [
      { label: 'Dashboard', icon: 'pi pi-chart-bar', route: 'dashboard' },
      { label: 'Diagnostics', icon: 'pi pi-bolt', route: 'diagnostics' },
      { label: 'Audit Logs', icon: 'pi pi-history', route: 'audit-logs' },
    ],
  },
]

const menuItems = computed(() =>
  navGroups.map((group) => ({
    label: group.label,
    items: group.items.map((it) => ({
      label: it.label,
      icon: it.icon,
      command: () => router.push({ name: it.route }),
      class: route.name === it.route ? 'router-active' : '',
    })),
  })),
)

function signOut() {
  auth.clear()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="flex h-screen">
    <aside class="w-64 shrink-0 border-r border-surface-200 dark:border-surface-800 bg-surface-0 dark:bg-surface-950 flex flex-col">
      <div class="px-4 py-4 border-b border-surface-200 dark:border-surface-800 flex items-center gap-2">
        <i class="pi pi-shield text-primary"></i>
        <span class="font-semibold">devslab-kit</span>
      </div>
      <div class="flex-1 overflow-y-auto py-2">
        <Menu :model="menuItems" class="border-0 w-full" />
      </div>
    </aside>

    <div class="flex-1 flex flex-col min-w-0">
      <header class="h-14 border-b border-surface-200 dark:border-surface-800 bg-surface-0 dark:bg-surface-950 flex items-center justify-between px-4">
        <div class="text-sm text-surface-600 dark:text-surface-400">
          {{ (route.meta.title as string | undefined) ?? route.name }}
        </div>
        <div class="flex items-center gap-2">
          <Button
            text
            rounded
            :icon="ui.theme === 'dark' ? 'pi pi-sun' : 'pi pi-moon'"
            severity="secondary"
            aria-label="Toggle theme"
            @click="ui.toggleTheme()"
          />
          <div class="text-sm text-surface-700 dark:text-surface-300 px-2">
            {{ auth.user?.loginId ?? '—' }}
          </div>
          <Button text rounded icon="pi pi-sign-out" severity="secondary" aria-label="Sign out" @click="signOut" />
        </div>
      </header>

      <main class="flex-1 overflow-auto p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
:deep(.router-active) {
  background-color: var(--p-highlight-background);
  color: var(--p-highlight-color);
}
</style>
