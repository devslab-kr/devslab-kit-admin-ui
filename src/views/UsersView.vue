<script setup lang="ts">
import Card from 'primevue/card'
import Message from 'primevue/message'
</script>

<template>
  <div class="flex flex-col gap-6">
    <h1 class="text-xl font-semibold">Users</h1>

    <Message severity="info" :closable="false">
      Users CRUD UI 는 다음 PR(Phase C1)에서 작성됩니다. 백엔드는 이미
      <code>/admin/api/v1/users</code> 에 endpoint 가 있어요.
    </Message>

    <Card>
      <template #content>
        <p class="text-surface-700 dark:text-surface-300">
          예정: DataTable + 필터 + 생성 다이얼로그 + lock/unlock/password reset.
        </p>
      </template>
    </Card>
  </div>
</template>
