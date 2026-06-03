<script setup lang="ts">
// A friendly empty state for tables/lists: an icon + message instead of a bare
// "no results" line. Keeps every list page consistent.
withDefaults(defineProps<{ icon?: string; message: string }>(), { icon: 'pi-inbox' })
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-3 py-12 text-surface-400 dark:text-surface-500">
    <i :class="['pi', icon, 'text-4xl opacity-70']" />
    <p class="text-sm">{{ message }}</p>
  </div>
</template>
