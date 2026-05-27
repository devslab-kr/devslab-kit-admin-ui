<script setup lang="ts">
import { onMounted, ref } from 'vue'
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
    toast.add({ severity: 'error', summary: 'Failed to load menus', detail: msg(e), life: 4000 })
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
    toast.add({ severity: 'success', summary: 'Menu created', life: 2500 })
    createOpen.value = false
    await reload()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Create failed', detail: msg(e), life: 4000 })
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
    toast.add({ severity: 'success', summary: 'Menu updated', life: 2500 })
    editOpen.value = false
    await reload()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Update failed', detail: msg(e), life: 4000 })
  }
}

function confirmDelete(item: MenuItem) {
  confirm.require({
    message: `Delete menu "${item.label}" and all its children?`,
    header: 'Delete menu',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await menusApi.remove(item.id.value)
        toast.add({ severity: 'success', summary: 'Menu deleted', life: 2500 })
        await reload()
      } catch (e) {
        toast.add({ severity: 'error', summary: 'Delete failed', detail: msg(e), life: 4000 })
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
      <h1 class="text-xl font-semibold">Menus</h1>
      <div class="flex items-center gap-2">
        <InputText v-model="tenantId" placeholder="tenantId" class="w-48" />
        <Button icon="pi pi-refresh" severity="secondary" outlined @click="reload" />
        <Button icon="pi pi-plus" label="Add root" @click="openCreate(null)" />
      </div>
    </div>

    <TreeTable :value="nodes" :loading="loading" data-key="key" :indent-size="24">
      <Column field="label" header="Label" expander style="min-width: 16rem">
        <template #body="{ node }">
          <span class="flex items-center gap-2">
            <i v-if="node.data.icon" :class="['pi', node.data.icon, 'text-surface-500']"></i>
            <span>{{ node.data.label }}</span>
            <span class="text-xs text-surface-500">({{ node.data.code }})</span>
          </span>
        </template>
      </Column>
      <Column field="path" header="Path" style="width: 14rem">
        <template #body="{ node }">
          <code class="text-xs">{{ node.data.path || '—' }}</code>
        </template>
      </Column>
      <Column field="requiredPermission" header="Required permission" style="width: 14rem">
        <template #body="{ node }">
          <code class="text-xs">{{ node.data.requiredPermission || '—' }}</code>
        </template>
      </Column>
      <Column field="displayOrder" header="Order" style="width: 6rem" />
      <Column header="" style="width: 12rem; text-align: right">
        <template #body="{ node }">
          <Button icon="pi pi-plus" text rounded aria-label="Add child" @click="openCreate(node.data.id.value)" />
          <Button icon="pi pi-pencil" text rounded aria-label="Edit" @click="openEdit(node.data)" />
          <Button
            icon="pi pi-trash"
            text
            rounded
            severity="danger"
            aria-label="Delete"
            @click="confirmDelete(node.data)"
          />
        </template>
      </Column>
    </TreeTable>

    <Dialog v-model:visible="createOpen" header="Create menu item" modal :style="{ width: '28rem' }">
      <div class="flex flex-col gap-3 pt-2">
        <InputText v-model="newMenu.code" placeholder="Code (e.g. admin.users)" />
        <InputText v-model="newMenu.label" placeholder="Display label" />
        <InputText v-model="newMenu.path" placeholder="Path (e.g. /admin/users)" />
        <InputText v-model="newMenu.icon" placeholder="Icon class (e.g. pi-users)" />
        <InputText v-model="newMenu.requiredPermission" placeholder="Required permission code" />
        <InputNumber v-model="newMenu.displayOrder" placeholder="Display order" :min="0" fluid />
      </div>
      <template #footer>
        <Button label="Cancel" text @click="createOpen = false" />
        <Button label="Create" icon="pi pi-check" @click="submitCreate" />
      </template>
    </Dialog>

    <Dialog v-model:visible="editOpen" header="Edit menu item" modal :style="{ width: '28rem' }">
      <p class="text-sm text-surface-600 dark:text-surface-300 mb-2">
        Editing <strong>{{ editTarget?.code }}</strong>
      </p>
      <div class="flex flex-col gap-3 pt-2">
        <InputText v-model="editForm.label" placeholder="Display label" />
        <InputText v-model="editForm.path" placeholder="Path" />
        <InputText v-model="editForm.icon" placeholder="Icon class" />
        <InputText v-model="editForm.requiredPermission" placeholder="Required permission code" />
        <InputNumber v-model="editForm.displayOrder" placeholder="Display order" :min="0" fluid />
      </div>
      <template #footer>
        <Button label="Cancel" text @click="editOpen = false" />
        <Button label="Save" icon="pi pi-check" @click="submitEdit" />
      </template>
    </Dialog>
  </div>
</template>
