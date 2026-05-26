<script setup lang="ts">
import { useRoute } from 'vue-router'
import Card from 'primevue/card'
import Message from 'primevue/message'

const route = useRoute()
const title = (route.meta.title as string | undefined) ?? (route.name as string)
</script>

<template>
  <div class="flex flex-col gap-6">
    <h1 class="text-xl font-semibold">{{ title }}</h1>

    <Message severity="warn" :closable="false">
      이 페이지는 placeholder 입니다. 실제 UI는 후속 PR (Phase C) 에서 작성됩니다.
    </Message>

    <Card>
      <template #content>
        <p class="text-surface-700 dark:text-surface-300">
          {{ title }} 화면 — 곧 작성 예정.
        </p>
      </template>
    </Card>
  </div>
</template>
