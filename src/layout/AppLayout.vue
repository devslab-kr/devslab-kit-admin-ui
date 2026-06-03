<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter, useRoute, RouterView } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useMediaQuery } from '@vueuse/core'
import Menu from 'primevue/menu'
import Button from 'primevue/button'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { getLocale, setLocale } from '@/i18n'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const ui = useUiStore()
const { t } = useI18n()

// Mobile off-canvas sidebar (drawer). Closes automatically on navigation so
// tapping a nav item on a phone takes you there and dismisses the drawer.
const sidebarOpen = ref(false)
watch(
  () => route.fullPath,
  () => {
    sidebarOpen.value = false
  },
)

// Once the viewport reaches desktop the sidebar is always shown (lg:static), so
// the drawer flag is meaningless there. Reset it on the way up so a stale "open"
// can't carry back down to mobile and leave the sidebar stuck visible after a
// resize round-trip.
const isDesktop = useMediaQuery('(min-width: 1024px)')
watch(isDesktop, (desktop) => {
  if (desktop) sidebarOpen.value = false
})

// Account dropdown anchored on the header username. PrimeVue's Menu in popup
// mode exposes toggle(event); type just that surface to avoid depending on an
// unexported component type.
const accountMenu = ref<{ toggle: (event: Event) => void } | null>(null)
const accountMenuItems = computed(() => [
  {
    label: t('account.changePassword'),
    icon: 'pi pi-key',
    command: () => router.push({ name: 'account-change-password' }),
  },
  {
    label: t('app.signOut'),
    icon: 'pi pi-sign-out',
    command: () => signOut(),
  },
])
function toggleAccountMenu(event: Event) {
  accountMenu.value?.toggle(event)
}

const navGroups = computed(() => [
  {
    label: t('nav.groups.identity'),
    items: [
      { label: t('nav.users'), icon: 'pi pi-user', route: 'users' },
      { label: t('nav.roles'), icon: 'pi pi-id-card', route: 'roles' },
      { label: t('nav.permissions'), icon: 'pi pi-key', route: 'permissions' },
      { label: t('nav.groupsItem'), icon: 'pi pi-users', route: 'groups' },
    ],
  },
  {
    label: t('nav.groups.platform'),
    items: [
      { label: t('nav.menus'), icon: 'pi pi-list', route: 'menus' },
      { label: t('nav.tenants'), icon: 'pi pi-building', route: 'tenants' },
      { label: t('nav.policies'), icon: 'pi pi-shield', route: 'policies' },
      { label: t('nav.settings'), icon: 'pi pi-cog', route: 'settings' },
      { label: t('nav.configSync'), icon: 'pi pi-sync', route: 'config-sync' },
    ],
  },
  {
    label: t('nav.groups.observability'),
    items: [
      { label: t('nav.dashboard'), icon: 'pi pi-chart-bar', route: 'dashboard' },
      { label: t('nav.diagnostics'), icon: 'pi pi-bolt', route: 'diagnostics' },
      { label: t('nav.auditLogs'), icon: 'pi pi-history', route: 'audit-logs' },
    ],
  },
])

const menuItems = computed(() =>
  navGroups.value.map((group) => ({
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

function toggleLocale() {
  setLocale(getLocale() === 'ko' ? 'en' : 'ko')
}
</script>

<template>
  <div class="flex h-screen">
    <!-- Mobile backdrop: tap to dismiss the drawer. -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-30 bg-black/50 lg:hidden"
      aria-hidden="true"
      @click="sidebarOpen = false"
    ></div>

    <aside
      class="fixed inset-y-0 left-0 z-40 w-64 shrink-0 border-r border-surface-200 dark:border-surface-800 bg-surface-0 dark:bg-surface-900 flex flex-col transform transition-transform duration-200 ease-in-out lg:static lg:z-auto lg:translate-x-0"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="px-4 py-4 border-b border-surface-200 dark:border-surface-800 flex items-center gap-2">
        <i class="pi pi-shield text-primary"></i>
        <span class="font-semibold">{{ t('app.title') }}</span>
      </div>
      <div class="flex-1 overflow-y-auto py-2">
        <Menu :model="menuItems" class="border-0 w-full" />
      </div>
    </aside>

    <div class="flex-1 flex flex-col min-w-0">
      <header class="h-14 border-b border-surface-200 dark:border-surface-800 bg-surface-0 dark:bg-surface-900 flex items-center justify-between px-4">
        <div class="flex items-center gap-2 min-w-0">
          <div class="lg:hidden">
            <Button
              text
              rounded
              severity="secondary"
              icon="pi pi-bars"
              v-tooltip.top="t('app.openMenu')"
              :aria-label="t('app.openMenu')"
              @click="sidebarOpen = true"
            />
          </div>
          <div class="text-sm text-surface-600 dark:text-surface-400 truncate">
            {{ (route.meta.title as string | undefined) ?? route.name }}
          </div>
        </div>
        <div class="flex items-center gap-2">
          <Button
            text
            rounded
            severity="secondary"
            v-tooltip.top="t('app.toggleLocale')" :aria-label="t('app.toggleLocale')"
            data-testid="locale-toggle"
            @click="toggleLocale"
          >
            <span class="text-xs font-semibold uppercase">{{ getLocale() }}</span>
          </Button>
          <Button
            text
            rounded
            :icon="ui.theme === 'dark' ? 'pi pi-sun' : 'pi pi-moon'"
            severity="secondary"
            v-tooltip.top="t('app.toggleTheme')" :aria-label="t('app.toggleTheme')"
            @click="ui.toggleTheme()"
          />
          <Button
            text
            severity="secondary"
            class="text-sm"
            icon="pi pi-user"
            icon-pos="left"
            :label="auth.user?.loginId ?? '—'"
            aria-haspopup="true"
            aria-controls="account-menu"
            data-testid="account-menu-button"
            @click="toggleAccountMenu"
          />
          <Menu id="account-menu" ref="accountMenu" :model="accountMenuItems" :popup="true" />
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
