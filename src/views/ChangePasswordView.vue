<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { useAuthStore } from '@/stores/auth'
import { authApi } from '@/api/auth'

const auth = useAuthStore()
const router = useRouter()
const toast = useToast()
const { t } = useI18n()

const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const submitting = ref(false)

const MIN_LENGTH = 8

// Only shown after the user has typed in both new-password fields, so the form
// doesn't scream "error" before they've had a chance to fill it in.
const mismatch = computed(
  () => confirmPassword.value.length > 0 && newPassword.value !== confirmPassword.value,
)
const tooShort = computed(
  () => newPassword.value.length > 0 && newPassword.value.length < MIN_LENGTH,
)
const sameAsOld = computed(
  () => newPassword.value.length > 0 && newPassword.value === oldPassword.value,
)
const canSubmit = computed(
  () =>
    oldPassword.value.length > 0 &&
    newPassword.value.length >= MIN_LENGTH &&
    newPassword.value === confirmPassword.value &&
    newPassword.value !== oldPassword.value,
)

async function submit() {
  if (!canSubmit.value) return
  submitting.value = true
  try {
    const result = await authApi.changePassword({
      oldPassword: oldPassword.value,
      newPassword: newPassword.value,
    })
    // Backend returns a fresh token with mustChangePassword=false — swap it in
    // so the router guard now lets us through to the dashboard.
    auth.setSession(result.token, result.user)
    toast.add({
      severity: 'success',
      summary: t('changePassword.toastSuccess'),
      life: 3000,
    })
    router.replace({ name: 'dashboard' })
  } catch (err: unknown) {
    let message = t('changePassword.failed')
    if (err && typeof err === 'object' && 'response' in err) {
      const resp = (err as { response?: { data?: { message?: string } } }).response
      message = resp?.data?.message ?? message
    }
    toast.add({
      severity: 'error',
      summary: t('changePassword.failed'),
      detail: message,
      life: 4000,
    })
  } finally {
    submitting.value = false
  }
}

function signOut() {
  auth.clear()
  router.replace({ name: 'login' })
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-surface-100 dark:bg-surface-900">
    <Card class="w-full max-w-md">
      <template #title>
        <div class="flex items-center gap-2">
          <i class="pi pi-key text-primary text-2xl"></i>
          <span>{{ t('changePassword.title') }}</span>
        </div>
      </template>
      <template #subtitle>
        {{ t('changePassword.subtitle') }}
      </template>
      <template #content>
        <form class="flex flex-col gap-4" @submit.prevent="submit">
          <div class="flex flex-col gap-1">
            <label for="oldPassword" class="text-sm font-medium">
              {{ t('changePassword.current') }}
            </label>
            <Password
              input-id="oldPassword"
              v-model="oldPassword"
              :feedback="false"
              toggle-mask
              autocomplete="current-password"
              required
              fluid
            />
          </div>

          <div class="flex flex-col gap-1">
            <label for="newPassword" class="text-sm font-medium">
              {{ t('changePassword.new') }}
            </label>
            <Password
              input-id="newPassword"
              v-model="newPassword"
              :feedback="true"
              toggle-mask
              autocomplete="new-password"
              required
              fluid
            />
            <small v-if="tooShort" class="text-red-500">
              {{ t('changePassword.tooShort', { n: MIN_LENGTH }) }}
            </small>
            <small v-else-if="sameAsOld" class="text-red-500">
              {{ t('changePassword.sameAsOld') }}
            </small>
          </div>

          <div class="flex flex-col gap-1">
            <label for="confirmPassword" class="text-sm font-medium">
              {{ t('changePassword.confirm') }}
            </label>
            <Password
              input-id="confirmPassword"
              v-model="confirmPassword"
              :feedback="false"
              toggle-mask
              autocomplete="new-password"
              required
              fluid
            />
            <small v-if="mismatch" class="text-red-500">
              {{ t('changePassword.mismatch') }}
            </small>
          </div>

          <Message severity="info" :closable="false" class="text-sm">
            {{ t('changePassword.hint') }}
          </Message>

          <Button
            type="submit"
            :loading="submitting"
            :disabled="submitting || !canSubmit"
            :label="t('changePassword.submit')"
            icon="pi pi-check"
          />
          <Button
            type="button"
            text
            severity="secondary"
            :label="t('app.signOut')"
            icon="pi pi-sign-out"
            @click="signOut"
          />
        </form>
      </template>
    </Card>
  </div>
</template>
