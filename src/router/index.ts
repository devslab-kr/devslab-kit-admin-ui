import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { public: true },
  },
  {
    path: '/change-password',
    name: 'change-password',
    component: () => import('@/views/ChangePasswordView.vue'),
    // Authenticated but standalone (no AppLayout): the user is gated here until
    // they rotate a bootstrap/temporary password. Not public — requires a token.
    meta: { forcedChange: true },
  },
  {
    path: '/',
    component: () => import('@/layout/AppLayout.vue'),
    redirect: { name: 'dashboard' },
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/views/DashboardView.vue'),
      },
      {
        path: 'users',
        name: 'users',
        component: () => import('@/views/UsersView.vue'),
      },
      {
        path: 'roles',
        name: 'roles',
        component: () => import('@/views/RolesView.vue'),
      },
      {
        path: 'permissions',
        name: 'permissions',
        component: () => import('@/views/PermissionsView.vue'),
      },
      {
        path: 'groups',
        name: 'groups',
        component: () => import('@/views/GroupsView.vue'),
      },
      {
        path: 'menus',
        name: 'menus',
        component: () => import('@/views/MenusView.vue'),
      },
      {
        path: 'audit-logs',
        name: 'audit-logs',
        component: () => import('@/views/AuditLogsView.vue'),
      },
      {
        path: 'tenants',
        name: 'tenants',
        component: () => import('@/views/TenantsView.vue'),
      },
      {
        path: 'policies',
        name: 'policies',
        component: () => import('@/views/PoliciesView.vue'),
      },
      {
        path: 'diagnostics',
        name: 'diagnostics',
        component: () => import('@/views/DiagnosticsView.vue'),
      },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('@/views/SettingsView.vue'),
      },
      {
        path: 'config-sync',
        name: 'config-sync',
        component: () => import('@/views/ConfigSyncView.vue'),
      },
      {
        // Voluntary self-service password change, inside the layout. The same
        // ChangePasswordView also serves the forced standalone route above; it
        // switches chrome based on auth.mustChangePassword.
        path: 'account/change-password',
        name: 'account-change-password',
        component: () => import('@/views/ChangePasswordView.vue'),
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: { name: 'dashboard' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (!to.meta.public && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'login' && auth.isAuthenticated) {
    return auth.mustChangePassword ? { name: 'change-password' } : { name: 'dashboard' }
  }
  // Force a pending password rotation before anything else: an authenticated
  // user whose flag is set is pinned to the change-password screen and cannot
  // reach any other authenticated route until they clear it.
  if (auth.isAuthenticated && auth.mustChangePassword && to.name !== 'change-password') {
    return { name: 'change-password' }
  }
  // Conversely, don't let a user who doesn't need it sit on that screen.
  if (to.name === 'change-password' && auth.isAuthenticated && !auth.mustChangePassword) {
    return { name: 'dashboard' }
  }
})

export default router
