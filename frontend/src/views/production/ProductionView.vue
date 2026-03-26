<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Órdenes de Producción</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Transformación y manufactura</p>
      </div>
      <button class="btn-primary flex items-center gap-2" @click="openCreate">
        <PlusIcon class="w-4 h-4" />
        Nueva Orden
      </button>
    </div>

    <!-- Filters -->
    <div class="card">
      <div class="flex flex-wrap gap-3">
        <select v-model="filters.status" class="input w-44">
          <option value="">Todos los estados</option>
          <option value="PLANNED">Planeado</option>
          <option value="IN_PROGRESS">En Proceso</option>
          <option value="COMPLETED">Completado</option>
          <option value="CANCELLED">Cancelado</option>
        </select>
        <div class="flex items-center gap-2">
          <input v-model="filters.dateFrom" type="date" class="input w-40" placeholder="Desde" />
          <span class="text-gray-400 text-sm">al</span>
          <input v-model="filters.dateTo" type="date" class="input w-40" placeholder="Hasta" />
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="card p-0">
      <DataTable
        :columns="columns"
        :data="orders"
        :loading="loading"
        :pagination="pagination"
        @page-change="onPageChange"
      >
        <template #cell-status="{ value }">
          <span :class="statusBadge(value)">{{ statusLabel(value) }}</span>
        </template>
        <template #cell-startDate="{ value }">{{ formatDate(value) }}</template>
        <template #cell-endDate="{ value }">{{ formatDate(value) }}</template>
        <template #cell-scrapRate="{ value }">
          <span v-if="value !== null && value !== undefined">{{ Number(value).toFixed(1) }}%</span>
          <span v-else class="text-gray-300 dark:text-gray-600">—</span>
        </template>
        <template #cell-actions="{ row }">
          <div class="flex gap-1">
            <router-link :to="`/production/${row.id}`" class="btn-ghost text-xs px-2 py-1">
              <EyeIcon class="w-3.5 h-3.5" />
            </router-link>
            <button
              v-if="row.status === 'PLANNED'"
              class="btn-ghost text-xs px-2 py-1 text-blue-600"
              @click="startOrder(row)"
            >
              <PlayIcon class="w-3.5 h-3.5" />
            </button>
            <button
              v-if="row.status === 'IN_PROGRESS'"
              class="btn-ghost text-xs px-2 py-1 text-green-600"
              @click="openComplete(row)"
            >
              <CheckCircleIcon class="w-3.5 h-3.5" />
            </button>
            <button
              v-if="['PLANNED', 'IN_PROGRESS'].includes(row.status)"
              class="btn-ghost text-xs px-2 py-1 text-red-500"
              @click="confirmCancel(row)"
            >
              <XCircleIcon class="w-3.5 h-3.5" />
            </button>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Create Modal -->
    <AppModal v-model="showCreateModal" title="Nueva Orden de Producción" size="xl">
      <form @submit.prevent="submitCreate" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Descripción *</label>
            <input v-model="createForm.description" class="input" required />
          </div>
          <div>
            <label class="label">Fecha de Inicio</label>
            <input v-model="createForm.startDate" type="date" class="input" />
          </div>
        </div>

        <!-- Inputs -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="label mb-0 text-orange-600 dark:text-orange-400">Materiales de Entrada</label>
            <button type="button" class="btn-ghost text-xs" @click="addInput">
              <PlusIcon class="w-3.5 h-3.5 inline" /> Agregar
            </button>
          </div>
          <div class="space-y-2">
            <div v-for="(inp, idx) in createForm.inputs" :key="'in-' + idx" class="flex gap-2 items-end">
              <div class="flex-1">
                <select v-model="inp.productId" class="input text-sm">
                  <option value="">Producto...</option>
                  <option v-for="p in products" :key="p.id" :value="p.id">{{ p.code }} - {{ p.name }}</option>
                </select>
              </div>
              <div class="w-24">
                <input v-model.number="inp.plannedQty" type="number" min="0.01" step="0.01" class="input text-sm" placeholder="Cant." />
              </div>
              <div class="w-32">
                <input v-model.number="inp.unitCost" type="number" min="0" step="0.01" class="input text-sm" placeholder="Costo" />
              </div>
              <button type="button" class="btn-ghost p-1.5 text-red-500" @click="createForm.inputs.splice(idx, 1)">
                <XMarkIcon class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- Outputs -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="label mb-0 text-green-600 dark:text-green-400">Productos de Salida</label>
            <button type="button" class="btn-ghost text-xs" @click="addOutput">
              <PlusIcon class="w-3.5 h-3.5 inline" /> Agregar
            </button>
          </div>
          <div class="space-y-2">
            <div v-for="(out, idx) in createForm.outputs" :key="'out-' + idx" class="flex gap-2 items-end">
              <div class="flex-1">
                <select v-model="out.productId" class="input text-sm">
                  <option value="">Producto...</option>
                  <option v-for="p in products" :key="p.id" :value="p.id">{{ p.code }} - {{ p.name }}</option>
                </select>
              </div>
              <div class="w-28">
                <input v-model.number="out.plannedQty" type="number" min="0.01" step="0.01" class="input text-sm" placeholder="Cant. Plan." />
              </div>
              <button type="button" class="btn-ghost p-1.5 text-red-500" @click="createForm.outputs.splice(idx, 1)">
                <XMarkIcon class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </form>
      <template #footer>
        <button class="btn-secondary" @click="showCreateModal = false">Cancelar</button>
        <button class="btn-primary" :disabled="saving" @click="submitCreate">
          {{ saving ? 'Creando...' : 'Crear Orden' }}
        </button>
      </template>
    </AppModal>

    <!-- Confirm Cancel -->
    <ConfirmModal
      v-model="showConfirmCancel"
      title="Cancelar Orden"
      :message="`¿Cancelar la orden de producción '${cancelingItem?.folio}'?`"
      confirm-text="Cancelar Orden"
      variant="danger"
      @confirm="cancelOrder"
    />
  </div>
</template>

<script setup>
import { productionApi, productsApi } from '@/services/api'
import { ref, reactive, watch, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { PlusIcon, EyeIcon, PlayIcon, CheckCircleIcon, XCircleIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import DataTable from '@/components/ui/DataTable.vue'
import AppModal from '@/components/ui/AppModal.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'

const toast = useToast()
const loading = ref(false)
const saving = ref(false)
const orders = ref([])
const products = ref([])
const showCreateModal = ref(false)
const showConfirmCancel = ref(false)
const cancelingItem = ref(null)

const pagination = reactive({ page: 1, limit: 20, total: 0 })
const filters = reactive({ status: '', dateFrom: '', dateTo: '' })

const createForm = reactive({
  description: '', startDate: '',
  inputs: [{ productId: '', plannedQty: 1, unitCost: 0 }],
  outputs: [{ productId: '', plannedQty: 1 }],
})

const columns = [
  { key: 'folio', label: 'Folio', sortable: true },
  { key: 'description', label: 'Descripción' },
  { key: 'status', label: 'Estado' },
  { key: 'startDate', label: 'Inicio' },
  { key: 'endDate', label: 'Fin' },
  { key: 'scrapRate', label: 'Merma' },
  { key: 'actions', label: 'Acciones' },
]

function statusBadge(s) {
  const m = { PLANNED: 'badge-gray', IN_PROGRESS: 'badge-blue', COMPLETED: 'badge-green', CANCELLED: 'badge-red' }
  return m[s] || 'badge-gray'
}

function statusLabel(s) {
  const m = { PLANNED: 'Planeado', IN_PROGRESS: 'En Proceso', COMPLETED: 'Completado', CANCELLED: 'Cancelado' }
  return m[s] || s
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function addInput() { createForm.inputs.push({ productId: '', plannedQty: 1, unitCost: 0 }) }
function addOutput() { createForm.outputs.push({ productId: '', plannedQty: 1 }) }

function openCreate() {
  Object.assign(createForm, {
    description: '', startDate: '',
    inputs: [{ productId: '', plannedQty: 1, unitCost: 0 }],
    outputs: [{ productId: '', plannedQty: 1 }],
  })
  showCreateModal.value = true
}

function openComplete(row) {
  window.location.href = `/production/${row.id}`
}

async function startOrder(row) {
  try {
    await productionApi.start(row.id)
    toast.success('Orden iniciada')
    fetchOrders()
  } catch (err) {
    toast.error('Error al iniciar orden')
  }
}

function confirmCancel(row) {
  cancelingItem.value = row
  showConfirmCancel.value = true
}

async function cancelOrder() {
  try {
    await productionApi.cancel(cancelingItem.value.id)
    toast.success('Orden cancelada')
    fetchOrders()
  } catch (err) {
    toast.error('Error al cancelar orden')
  }
}

async function submitCreate() {
  if (!createForm.description) {
    toast.warning('La descripción es requerida')
    return
  }
  saving.value = true
  try {
    await productionApi.create({
      description: createForm.description,
      startDate: createForm.startDate ? createForm.startDate + 'T00:00:00.000Z' : undefined,
      inputs: createForm.inputs.filter(i => i.productId).map(i => ({
        productId: i.productId,
        plannedQty: i.plannedQty,
        unitCost: i.unitCost,
      })),
      outputs: createForm.outputs.filter(o => o.productId).map(o => ({
        productId: o.productId,
        plannedQty: o.plannedQty,
      })),
    })
    toast.success('Orden de producción creada')
    showCreateModal.value = false
    fetchOrders()
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Error al crear orden')
  } finally {
    saving.value = false
  }
}

async function fetchOrders() {
  loading.value = true
  try {
    const res = await productionApi.list({
      page: pagination.page,
      limit: pagination.limit,
      status: filters.status || undefined,
      from: filters.dateFrom || undefined,
      to: filters.dateTo || undefined,
    })
    orders.value = res.data.data || res.data.items || (Array.isArray(res.data) ? res.data : [])
    if ((res.data.meta?.total ?? res.data.total) !== undefined) pagination.total = res.data.meta?.total ?? res.data.total
  } catch (err) {
    toast.error('Error al cargar órdenes')
  } finally {
    loading.value = false
  }
}

function onPageChange(p) { pagination.page = p; fetchOrders() }
watch(filters, () => { pagination.page = 1; fetchOrders() })

onMounted(async () => {
  const pRes = await productsApi.list({ limit: 500 })
  products.value = pRes.data.data || pRes.data.items || (Array.isArray(pRes.data) ? pRes.data : [])
  fetchOrders()
})
</script>
