<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import TreeTable from 'primevue/treetable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { menusApi, type MenuItem } from '@/api/menus'
import { useAuthStore } from '@/stores/auth'

interface TreeNode {
  key: string
  data: MenuItem
  children: TreeNode[]
}

const auth = useAuthStore()
const toast = useToast()
const confirm = useConfirm()
const { t } = useI18n()

const tenantId = ref(auth.user?.tenantId ?? 'default')
const nodes = ref<TreeNode[]>([])
const loading = ref(false)

const createOpen = ref(false)
const editOpen = ref(false)
const createParentId = ref<string | null>(null)
const newMenu = ref({
  code: '',
  label: '',
  path: '',
  icon: '',
  requiredPermission: '',
  displayOrder: 0,
})
const editTarget = ref<MenuItem | null>(null)
const editForm = ref({
  label: '',
  path: '',
  icon: '',
  requiredPermission: '',
  displayOrder: 0,
})

function toTree(items: MenuItem[]): TreeNode[] {
  return items.map((item) => ({
    key: item.id.value,
    data: item,
    children: item.children ? toTree(item.children) : [],
  }))
}

async function reload() {
  loading.value = true
  try {
    const tree = await menusApi.tree(tenantId.value)
    nodes.value = toTree(tree)
  } catch (e) {
    toast.add({ severity: 'error', summary: t('menus.toasts.loadFailed'), detail: msg(e), life: 4000 })
  } finally {
    loading.value = false
  }
}

function openCreate(parentId: string | null) {
  createParentId.value = parentId
  newMenu.value = { code: '', label: '', path: '', icon: '', requiredPermission: '', displayOrder: 0 }
  createOpen.value = true
}

async function submitCreate() {
  try {
    await menusApi.create({
      tenantId: tenantId.value,
      parentId: createParentId.value,
      code: newMenu.value.code,
      label: newMenu.value.label,
      path: newMenu.value.path || undefined,
      icon: newMenu.value.icon || undefined,
      requiredPermission: newMenu.value.requiredPermission || undefined,
      displayOrder: newMenu.value.displayOrder,
    })
    toast.add({ severity: 'success', summary: t('menus.toasts.created'), life: 2500 })
    createOpen.value = false
    await reload()
  } catch (e) {
    toast.add({ severity: 'error', summary: t('toasts.createFailed'), detail: msg(e), life: 4000 })
  }
}

function openEdit(item: MenuItem) {
  editTarget.value = item
  editForm.value = {
    label: item.label,
    path: item.path ?? '',
    icon: item.icon ?? '',
    requiredPermission: item.requiredPermission ?? '',
    displayOrder: item.displayOrder,
  }
  editOpen.value = true
}

async function submitEdit() {
  if (!editTarget.value) return
  try {
    await menusApi.update(editTarget.value.id.value, {
      label: editForm.value.label,
      path: editForm.value.path || null,
      icon: editForm.value.icon || null,
      requiredPermission: editForm.value.requiredPermission || null,
      displayOrder: editForm.value.displayOrder,
    })
    toast.add({ severity: 'success', summary: t('menus.toasts.updated'), life: 2500 })
    editOpen.value = false
    await reload()
  } catch (e) {
    toast.add({ severity: 'error', summary: t('toasts.updateFailed'), detail: msg(e), life: 4000 })
  }
}

function confirmDelete(item: MenuItem) {
  confirm.require({
    message: t('menus.deleteConfirm.message', { label: item.label }),
    header: t('menus.deleteConfirm.header'),
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await menusApi.remove(item.id.value)
        toast.add({ severity: 'success', summary: t('menus.toasts.deleted'), life: 2500 })
        await reload()
      } catch (e) {
        toast.add({ severity: 'error', summary: t('toasts.deleteFailed'), detail: msg(e), life: 4000 })
      }
    },
  })
}

function msg(e: unknown): string {
  if (e && typeof e === 'object' && 'response' in e) {
    const r = (e as { response?: { data?: { message?: string } } }).response
    return r?.data?.message ?? String(e)
  }
  return String(e)
}

onMounted(reload)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold">{{ t('menus.title') }}</h1>
      <div class="flex items-center gap-2">
        <InputText v-model="tenantId" :placeholder="t('common.tenantId')" class="w-48" />
        <Button icon="pi pi-refresh" severity="secondary" outlined :aria-label="t('common.ariaRefresh')" @click="reload" />
        <Button icon="pi pi-plus" :label="t('menus.addRoot')" @click="openCreate(null)" />
      </div>
    </div>

    <TreeTable :value="nodes" :loading="loading" data-key="key" :indent-size="24">
      <Column field="label" :header="t('menus.columns.label')" expander style="min-width: 16rem">
        <template #body="{ node }">
          <span class="flex items-center gap-2">
            <i v-if="node.data.icon" :class="['pi', node.data.icon, 'text-surface-500']"></i>
            <span>{{ node.data.label }}</span>
            <span class="text-xs text-surface-500">({{ node.data.code }})</span>
          </span>
        </template>
      </Column>
      <Column field="path" :header="t('menus.columns.path')" style="width: 14rem">
        <template #body="{ node }">
          <code class="text-xs">{{ node.data.path || '—' }}</code>
        </template>
      </Column>
      <Column field="requiredPermission" :header="t('menus.columns.requiredPermission')" style="width: 14rem">
        <template #body="{ node }">
          <code class="text-xs">{{ node.data.requiredPermission || '—' }}</code>
        </template>
      </Column>
      <Column field="displayOrder" :header="t('menus.columns.order')" style="width: 6rem" />
      <Column header="" style="width: 12rem; text-align: right">
        <template #body="{ node }">
          <Button icon="pi pi-plus" text rounded :aria-label="t('menus.ariaAddChild')" @click="openCreate(node.data.id.value)" />
          <Button icon="pi pi-pencil" text rounded :aria-label="t('common.ariaEdit')" @click="openEdit(node.data)" />
          <Button
            icon="pi pi-trash"
            text
            rounded
            severity="danger"
            :aria-label="t('common.ariaDelete')"
            @click="confirmDelete(node.data)"
          />
        </template>
      </Column>
    </TreeTable>

    <Dialog v-model:visible="createOpen" :header="t('menus.createDialog.title')" modal :style="{ width: '28rem' }">
      <div class="flex flex-col gap-3 pt-2">
        <InputText v-model="newMenu.code" :placeholder="t('menus.createDialog.codePlaceholder')" />
        <InputText v-model="newMenu.label" :placeholder="t('menus.createDialog.labelPlaceholder')" />
        <InputText v-model="newMenu.path" :placeholder="t('menus.createDialog.pathPlaceholder')" />
        <InputText v-model="newMenu.icon" :placeholder="t('menus.createDialog.iconPlaceholder')" />
        <InputText v-model="newMenu.requiredPermission" :placeholder="t('menus.createDialog.permissionPlaceholder')" />
        <InputNumber v-model="newMenu.displayOrder" :placeholder="t('menus.createDialog.orderPlaceholder')" :min="0" fluid />
      </div>
      <template #footer>
        <Button :label="t('common.cancel')" text @click="createOpen = false" />
        <Button :label="t('common.create')" icon="pi pi-check" @click="submitCreate" />
      </template>
    </Dialog>

    <Dialog v-model:visible="editOpen" :header="t('menus.editDialog.title')" modal :style="{ width: '28rem' }">
      <p class="text-sm text-surface-600 dark:text-surface-300 mb-2">
        {{ t('menus.editDialog.prompt', { code: editTarget?.code ?? '' }) }}
      </p>
      <div class="flex flex-col gap-3 pt-2">
        <InputText v-model="editForm.label" :placeholder="t('menus.createDialog.labelPlaceholder')" />
        <InputText v-model="editForm.path" :placeholder="t('menus.createDialog.pathPlaceholder')" />
        <InputText v-model="editForm.icon" :placeholder="t('menus.createDialog.iconPlaceholder')" />
        <InputText v-model="editForm.requiredPermission" :placeholder="t('menus.createDialog.permissionPlaceholder')" />
        <InputNumber v-model="editForm.displayOrder" :placeholder="t('menus.createDialog.orderPlaceholder')" :min="0" fluid />
      </div>
      <template #footer>
        <Button :label="t('common.cancel')" text @click="editOpen = false" />
        <Button :label="t('common.save')" icon="pi pi-check" @click="submitEdit" />
      </template>
    </Dialog>
  </div>
</template>
