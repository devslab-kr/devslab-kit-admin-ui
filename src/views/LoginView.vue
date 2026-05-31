<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import { useAuthStore } from '@/stores/auth'
import { authApi } from '@/api/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const toast = useToast()
const { t } = useI18n()

const tenantId = ref('default')
const loginId = ref('')
const rawPassword = ref('')
const submitting = ref(false)

async function submit() {
  if (!loginId.value || !rawPassword.value) return
  submitting.value = true
  try {
    const result = await authApi.login({
      tenantId: tenantId.value,
      loginId: loginId.value,
      rawPassword: rawPassword.value,
    })
    auth.setSession(result.token, result.user)
    if (auth.mustChangePassword) {
      // Forced rotation takes precedence over any redirect target.
      router.replace({ name: 'change-password' })
      return
    }
    const next = (route.query.redirect as string | undefined) ?? '/'
    router.replace(next)
  } catch (err: unknown) {
    let message = t('login.failed')
    if (err && typeof err === 'object' && 'response' in err) {
      const resp = (err as { response?: { data?: { message?: string } } }).response
      message = resp?.data?.message ?? message
    }
    toast.add({ severity: 'error', summary: t('login.failed'), detail: message, life: 4000 })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-surface-100 dark:bg-surface-900">
    <Card class="w-full max-w-md">
      <template #title>
        <div class="flex items-center gap-2">
          <i class="pi pi-shield text-primary text-2xl"></i>
          <span>{{ t('app.title') }}</span>
        </div>
      </template>
      <template #content>
        <form class="flex flex-col gap-4" @submit.prevent="submit">
          <div class="flex flex-col gap-1">
            <label for="tenantId" class="text-sm font-medium">{{ t('login.tenant') }}</label>
            <InputText id="tenantId" v-model="tenantId" autocomplete="organization" />
          </div>
          <div class="flex flex-col gap-1">
            <label for="loginId" class="text-sm font-medium">{{ t('login.loginId') }}</label>
            <InputText id="loginId" v-model="loginId" autocomplete="username" required />
          </div>
          <div class="flex flex-col gap-1">
            <label for="rawPassword" class="text-sm font-medium">{{ t('login.password') }}</label>
            <Password
              input-id="rawPassword"
              v-model="rawPassword"
              :feedback="false"
              toggle-mask
              required
              fluid
            />
          </div>
          <Button
            type="submit"
            :loading="submitting"
            :disabled="submitting"
            :label="t('login.submit')"
            icon="pi pi-sign-in"
          />
        </form>
      </template>
    </Card>
  </div>
</template>
