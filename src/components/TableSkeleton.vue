<script setup lang="ts">
// Loading placeholder for list tables: shows the shape of a table (a header
// strip + several rows) while the first page loads, instead of a bare area
// with a spinner. Pair with `v-if="loading && !items.length"` and put the real
// table on `v-else`, so background refreshes keep showing data.
import Skeleton from 'primevue/skeleton'

withDefaults(defineProps<{ columns?: number; rows?: number; label?: string }>(), {
  columns: 3,
  rows: 8,
  label: 'Loading…',
})
</script>

<template>
  <div
    class="border border-surface-200 dark:border-surface-700 rounded-md overflow-hidden"
    role="status"
    aria-busy="true"
    :aria-label="label"
  >
    <div
      class="flex gap-6 px-4 py-3 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800"
    >
      <Skeleton v-for="c in columns" :key="`h-${c}`" height="0.8rem" width="5rem" />
    </div>
    <div
      v-for="r in rows"
      :key="r"
      class="flex gap-6 px-4 py-3.5 border-b border-surface-100 dark:border-surface-800 last:border-b-0"
    >
      <Skeleton
        v-for="c in columns"
        :key="`${r}-${c}`"
        height="1rem"
        :width="c === columns ? '3rem' : c === 1 ? '9rem' : '7rem'"
      />
    </div>
  </div>
</template>
