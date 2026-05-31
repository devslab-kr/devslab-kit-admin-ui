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

// Forced mode = the account still carries the must-change flag (a bootstrap /
// temporary password). The global router guard pins such a user to the
// standalone /change-password route, so this is the only place the flag is set.
// Voluntary mode = a normal user changing their own password from the account
// menu, rendered inside AppLayout. The two differ in chrome and exit behaviour;
// the form + submit logic are shared.
const forced = computed(() => auth.mustChangePassword)

const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const submitting = ref(false)

const MIN_LENGTH = 8

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

function resetForm() {
  oldPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
}

async function submit() {
  if (!canSubmit.value) return
  submitting.value = true
  try {
    const result = await authApi.changePassword({
      oldPassword: oldPassword.value,
      newPassword: newPassword.value,
    })
    // Backend returns a fresh token (must-change cleared) — swap it in. In
    // forced mode this is what lets the guard release us to the dashboard.
    auth.setSession(result.token, result.user)
    toast.add({
      severity: 'success',
      summary: t('changePassword.toastSuccess'),
      life: 3000,
    })
    if (forced.value) {
      router.replace({ name: 'dashboard' })
    } else {
      // Voluntary: stay put, just clear the form for reuse.
      resetForm()
    }
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

// Forced: the only way out is to sign out. Voluntary: cancel back to dashboard.
function escape() {
  if (forced.value) {
    auth.clear()
    router.replace({ name: 'login' })
  } else {
    router.push({ name: 'dashboard' })
  }
}
</script>

<template>
  <!-- Forced mode: standalone centred card (no AppLayout around this route). -->
  <div
    v-if="forced"
    class="min-h-screen flex items-center justify-center p-4 bg-surface-100 dark:bg-surface-900"
  >
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
            @click="escape"
          />
        </form>
      </template>
    </Card>
  </div>

  <!-- Voluntary mode: a normal in-layout settings panel. -->
  <div v-else class="max-w-md">
    <h1 class="text-xl font-semibold mb-1">{{ t('changePassword.titleVoluntary') }}</h1>
    <p class="text-sm text-surface-600 dark:text-surface-400 mb-4">
      {{ t('changePassword.subtitleVoluntary') }}
    </p>
    <form class="flex flex-col gap-4" @submit.prevent="submit">
      <div class="flex flex-col gap-1">
        <label for="oldPassword2" class="text-sm font-medium">
          {{ t('changePassword.current') }}
        </label>
        <Password
          input-id="oldPassword2"
          v-model="oldPassword"
          :feedback="false"
          toggle-mask
          autocomplete="current-password"
          required
          fluid
        />
      </div>

      <div class="flex flex-col gap-1">
        <label for="newPassword2" class="text-sm font-medium">
          {{ t('changePassword.new') }}
        </label>
        <Password
          input-id="newPassword2"
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
        <label for="confirmPassword2" class="text-sm font-medium">
          {{ t('changePassword.confirm') }}
        </label>
        <Password
          input-id="confirmPassword2"
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

      <div class="flex gap-2">
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
          :label="t('common.cancel')"
          @click="escape"
        />
      </div>
    </form>
  </div>
</template>
