<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Dialog from 'primevue/dialog'
import PickList from 'primevue/picklist'
import Button from 'primevue/button'
import type { AssignOption } from './assign'

const props = defineProps<{
  visible: boolean
  title: string
  all: AssignOption[]
  assignedIds: string[]
  saving?: boolean
}>()

const emit = defineEmits<{
  'update:visible': [boolean]
  save: [added: string[], removed: string[]]
}>()

const { t } = useI18n()

// PickList model is a tuple [source = available, target = assigned].
const model = ref<[AssignOption[], AssignOption[]]>([[], []])
const originalAssigned = ref<Set<string>>(new Set())

function rebuild() {
  const assigned = new Set(props.assignedIds)
  originalAssigned.value = assigned
  model.value = [
    props.all.filter((o) => !assigned.has(o.id)),
    props.all.filter((o) => assigned.has(o.id)),
  ]
}

watch(
  () => [props.visible, props.all, props.assignedIds] as const,
  () => {
    if (props.visible) rebuild()
  },
  { immediate: true, deep: true },
)

function save() {
  const now = new Set(model.value[1].map((o) => o.id))
  const added = [...now].filter((id) => !originalAssigned.value.has(id))
  const removed = [...originalAssigned.value].filter((id) => !now.has(id))
  emit('save', added, removed)
}
</script>

<template>
  <Dialog
    :visible="visible"
    :header="title"
    modal
    dismissable-mask
    :style="{ width: '54rem' }"
    :breakpoints="{ '960px': '95vw' }"
    @update:visible="emit('update:visible', $event)"
  >
    <PickList
      v-model="model"
      data-key="id"
      :show-source-controls="false"
      :show-target-controls="false"
      breakpoint="700px"
      scroll-height="24rem"
    >
      <template #sourceheader>{{ t('assign.available') }}</template>
      <template #targetheader>{{ t('assign.assigned') }}</template>
      <template #item="{ item }">
        <div class="flex flex-col">
          <span class="font-medium">{{ item.label }}</span>
          <span v-if="item.sub" class="text-xs text-surface-400">{{ item.sub }}</span>
        </div>
      </template>
    </PickList>
    <template #footer>
      <Button :label="t('common.cancel')" text @click="emit('update:visible', false)" />
      <Button :label="t('common.save')" icon="pi pi-check" :loading="saving" @click="save" />
    </template>
  </Dialog>
</template>
