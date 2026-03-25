<template>
  <div class="space-y-6">
    <!-- Back + Header -->
    <div class="page-header">
      <div class="flex items-center gap-4">
        <button class="btn-ghost p-2 rounded-lg" @click="$router.push('/production')">
          <ArrowLeftIcon class="w-5 h-5" />
        </button>
        <div>
          <div class="flex items-center gap-3">
            <h1 class="page-title">{{ order?.folio || 'Cargando...' }}</h1>
            <span v-if="order" :class="statusBadge(order.status)">{{ statusLabel(order.status) }}</span>
          </div>
          <p v-if="order" class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{{ order.description }}</p>
        </div>
      </div>
      <div class="flex gap-2">
        <button
          v-if="order?.status === 'PLANNED'"
          class="btn-primary flex items-center gap-2"
          @click="startOrder"
        >
          <PlayIcon class="w-4 h-4" />
          Iniciar Producción
        </button>
        <button
          v-if="order?.status === 'IN_PROGRESS'"
          class="btn-primary flex items-center gap-2"
          @click="showCompleteModal = true"
        >
          <CheckCircleIcon class="w-4 h-4" />
          Completar Orden
        </button>
        <button
          v-if="['PLANNED', 'IN_PROGRESS'].includes(order?.status)"
          class="btn-danger flex items-center gap-2"
          @click="showCancelConfirm = true"
        >
          <XCircleIcon class="w-4 h-4" />
          Cancelar
        </button>
      </div>
    </div>

    <!-- Status Timeline -->
    <div v-if="order" class="card">
      <div class="flex items-center gap-0">
        <div v-for="(step, idx) in statusSteps" :key="step.key" class="flex items-center flex-1">
          <div class="flex flex-col items-center">
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              :class="isStepDone(step.key) ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'"
            >
              {{ idx + 1 }}
            </div>
            <span class="text-xs mt-1 text-gray-500 dark:text-gray-400 whitespace-nowrap">{{ step.label }}</span>
          </div>
          <div
            v-if="idx < statusSteps.length - 1"
            class="flex-1 h-0.5 mx-2"
            :class="isStepDone(statusSteps[idx + 1].key) ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'"
          ></div>
        </div>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-pulse">
      <div class="card">
        <div class="space-y-3">
          <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    </div>

    <template v-else-if="order">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Inputs -->
        <div class="card p-0">
          <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
            <ArrowDownIcon class="w-4 h-4 text-orange-500" />
            <h3 class="font-semibold text-gray-900 dark:text-white">Materiales de Entrada</h3>
          </div>
          <DataTable :columns="inputColumns" :data="order.inputs" :loading="false">
            <template #cell-consumed="{ row }">
              <span :class="(row.consumed || 0) >= row.plannedQty ? 'text-green-600 font-semibold' : 'text-amber-500'">
                {{ row.consumed || 0 }} / {{ row.plannedQty }}
              </span>
            </template>
          </DataTable>
        </div>

        <!-- Outputs -->
        <div class="card p-0">
          <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
            <ArrowUpIcon class="w-4 h-4 text-green-500" />
            <h3 class="font-semibold text-gray-900 dark:text-white">Productos de Salida</h3>
          </div>
          <DataTable :columns="outputColumns" :data="order.outputs" :loading="false">
            <template #cell-produced="{ row }">
              <span :class="(row.produced || 0) >= row.plannedQty ? 'text-green-600 font-semibold' : 'text-amber-500'">
                {{ row.produced || 0 }} / {{ row.plannedQty }}
              </span>
            </template>
            <template #cell-scrap="{ value }">
              <span v-if="value" class="text-red-500">{{ value }}</span>
              <span v-else class="text-gray-300 dark:text-gray-600">—</span>
            </template>
          </DataTable>
        </div>
      </div>
    </template>

    <!-- Complete Modal -->
    <AppModal v-model="showCompleteModal" title="Completar Orden de Producción" size="lg">
      <form @submit.prevent="submitComplete" class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-300">
          Ingresa las cantidades producidas y merma para cerrar esta orden.
        </p>
        <div class="space-y-3">
          <div
            v-for="(out, idx) in completeForm.outputs"
            :key="idx"
            class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
          >
            <p class="text-sm font-medium text-gray-900 dark:text-white mb-2">
              {{ out.productName }}
              <span class="text-gray-400 font-normal">(Plan: {{ out.plannedQty }})</span>
            </p>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label text-xs">Cantidad Producida *</label>
                <input v-model.number="out.producedQty" type="number" min="0" step="0.01" class="input text-sm" required />
              </div>
              <div>
                <label class="label text-xs">Merma (scrap)</label>
                <input v-model.number="out.scrapQty" type="number" min="0" step="0.01" class="input text-sm" />
              </div>
            </div>
          </div>
        </div>
      </form>
      <template #footer>
        <button class="btn-secondary" @click="showCompleteModal = false">Cancelar</button>
        <button class="btn-primary" :disabled="completing" @click="submitComplete">
          {{ completing ? 'Completando...' : 'Confirmar Producción' }}
        </button>
      </template>
    </AppModal>

    <!-- Cancel Confirm -->
    <ConfirmModal
      v-model="showCancelConfirm"
      title="Cancelar Orden de Producción"
      :message="`¿Cancelar la orden ${order?.folio}?`"
      confirm-text="Sí, cancelar"
      variant="danger"
      @confirm="cancelOrder"
    />
  </div>
</template>

<script setup>
import { productionApi } from '@/services/api'
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import {
  ArrowLeftIcon, PlayIcon, CheckCircleIcon, XCircleIcon,
  ArrowDownIcon, ArrowUpIcon,
} from '@heroicons/vue/24/outline'
import DataTable from '@/components/ui/DataTable.vue'
import AppModal from '@/components/ui/AppModal.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const loading = ref(false)
const completing = ref(false)
const order = ref(null)
const showCompleteModal = ref(false)
const showCancelConfirm = ref(false)

const completeForm = reactive({ outputs: [] })

const statusSteps = [
  { key: 'PLANNED', label: 'Planeado' },
  { key: 'IN_PROGRESS', label: 'En Proceso' },
  { key: 'COMPLETED', label: 'Completado' },
]

const inputColumns = [
  { key: 'productCode', label: 'Código' },
  { key: 'productName', label: 'Material' },
  { key: 'plannedQty', label: 'Planeado' },
  { key: 'consumed', label: 'Consumido / Plan.' },
  { key: 'unit', label: 'Unidad' },
]

const outputColumns = [
  { key: 'productCode', label: 'Código' },
  { key: 'productName', label: 'Producto' },
  { key: 'plannedQty', label: 'Planeado' },
  { key: 'produced', label: 'Producido / Plan.' },
  { key: 'scrap', label: 'Merma' },
  { key: 'unit', label: 'Unidad' },
]

function statusBadge(s) {
  const m = { PLANNED: 'badge-gray', IN_PROGRESS: 'badge-blue', COMPLETED: 'badge-green', CANCELLED: 'badge-red' }
  return m[s] || 'badge-gray'
}

function statusLabel(s) {
  const m = { PLANNED: 'Planeado', IN_PROGRESS: 'En Proceso', COMPLETED: 'Completado', CANCELLED: 'Cancelado' }
  return m[s] || s
}

function isStepDone(stepKey) {
  const order_ = ['PLANNED', 'IN_PROGRESS', 'COMPLETED']
  const orderIdx = order_.indexOf(stepKey)
  const currentIdx = order_.indexOf(order.value?.status)
  return currentIdx >= orderIdx
}

async function startOrder() {
  try {
    await productionApi.start(route.params.id)
    toast.success('Orden iniciada')
    fetchOrder()
  } catch (err) {
    toast.error('Error al iniciar orden')
  }
}

async function cancelOrder() {
  try {
    await productionApi.cancel(route.params.id)
    toast.success('Orden cancelada')
    fetchOrder()
  } catch (err) {
    toast.error('Error al cancelar orden')
  }
}

function openCompleteModal() {
  if (!order.value) return
  completeForm.outputs = (order.value.outputs || []).map(o => ({
    outputId: o.id,
    productName: o.productName,
    plannedQty: o.plannedQty,
    producedQty: o.plannedQty,
    scrapQty: 0,
  }))
  showCompleteModal.value = true
}

async function submitComplete() {
  completing.value = true
  try {
    await productionApi.complete(route.params.id, { outputs: completeForm.outputs })
    toast.success('Orden completada')
    showCompleteModal.value = false
    fetchOrder()
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Error al completar orden')
  } finally {
    completing.value = false
  }
}

async function fetchOrder() {
  loading.value = true
  try {
    const res = await productionApi.get(route.params.id)
    order.value = res.data
  } catch (err) {
    toast.error('Error al cargar orden de producción')
  } finally {
    loading.value = false
  }
}

onMounted(fetchOrder)
</script>
