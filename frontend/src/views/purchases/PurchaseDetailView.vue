<template>
  <div class="space-y-6">
    <!-- Back + Header -->
    <div class="page-header">
      <div class="flex items-center gap-4">
        <button class="btn-ghost p-2 rounded-lg" @click="$router.push('/purchases')">
          <ArrowLeftIcon class="w-5 h-5" />
        </button>
        <div>
          <div class="flex items-center gap-3">
            <h1 class="page-title">{{ purchase?.folio || 'Cargando...' }}</h1>
            <span v-if="purchase" :class="statusBadge(purchase.status)">{{ statusLabel(purchase.status) }}</span>
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Orden de compra</p>
        </div>
      </div>
      <div class="flex gap-2">
        <button
          v-if="['CONFIRMED', 'PARTIAL'].includes(purchase?.status)"
          class="btn-primary flex items-center gap-2"
          @click="showReceiveModal = true"
        >
          <InboxArrowDownIcon class="w-4 h-4" />
          Recibir Material
        </button>
        <button
          v-if="!['RECEIVED', 'CANCELLED'].includes(purchase?.status)"
          class="btn-danger flex items-center gap-2"
          @click="showCancelConfirm = true"
        >
          <XCircleIcon class="w-4 h-4" />
          Cancelar
        </button>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-pulse">
      <div class="card lg:col-span-2">
        <div class="space-y-3">
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
      <div class="card">
        <div class="space-y-3">
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    </div>

    <template v-else-if="purchase">
      <!-- Info cards -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Supplier Info -->
        <div class="card lg:col-span-2">
          <h3 class="font-semibold text-gray-900 dark:text-white mb-3">Información del Proveedor</h3>
          <div class="grid grid-cols-2 gap-y-2 text-sm">
            <span class="text-gray-500 dark:text-gray-400">Proveedor</span>
            <span class="font-medium">{{ purchase.supplierName }}</span>
            <span class="text-gray-500 dark:text-gray-400">RFC</span>
            <span>{{ purchase.supplierRfc || '—' }}</span>
            <span class="text-gray-500 dark:text-gray-400">Contacto</span>
            <span>{{ purchase.supplierContact || '—' }}</span>
            <span class="text-gray-500 dark:text-gray-400">Notas</span>
            <span>{{ purchase.notes || '—' }}</span>
          </div>
        </div>

        <!-- Dates & Totals -->
        <div class="card">
          <h3 class="font-semibold text-gray-900 dark:text-white mb-3">Fechas</h3>
          <div class="space-y-2 text-sm mb-4">
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">Creada</span>
              <span>{{ formatDate(purchase.createdAt) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">Esperada</span>
              <span>{{ formatDate(purchase.expectedDate) }}</span>
            </div>
          </div>
          <div class="border-t border-gray-100 dark:border-gray-700 pt-3 space-y-1 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">Subtotal</span>
              <span>{{ formatCurrency(purchase.subtotal) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">IVA</span>
              <span>{{ formatCurrency(purchase.tax) }}</span>
            </div>
            <div class="flex justify-between font-bold text-base">
              <span>Total</span>
              <span>{{ formatCurrency(purchase.total) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Items Table -->
      <div class="card p-0">
        <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 class="font-semibold text-gray-900 dark:text-white">Artículos</h3>
        </div>
        <DataTable :columns="itemColumns" :data="purchase.items" :loading="false">
          <template #cell-subtotal="{ row }">
            {{ formatCurrency((row.orderedQty || 0) * (row.unitCost || 0)) }}
          </template>
          <template #cell-receivedQty="{ row }">
            <span :class="row.receivedQty >= row.orderedQty ? 'text-green-600 font-semibold' : 'text-amber-500'">
              {{ row.receivedQty || 0 }} / {{ row.orderedQty }}
            </span>
          </template>
          <template #cell-unitCost="{ value }">{{ formatCurrency(value) }}</template>
        </DataTable>
      </div>
    </template>

    <!-- Receive Modal -->
    <AppModal v-model="showReceiveModal" title="Recibir Material" size="lg">
      <form @submit.prevent="submitReceive" class="space-y-4">
        <div>
          <label class="label">Almacén de destino *</label>
          <select v-model="receiveForm.warehouseId" class="input" required>
            <option value="">Seleccionar...</option>
            <option v-for="wh in warehouses" :key="wh.id" :value="wh.id">{{ wh.name }}</option>
          </select>
        </div>
        <div class="space-y-3">
          <div
            v-for="(item, idx) in receiveForm.items"
            :key="idx"
            class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
          >
            <p class="text-sm font-medium text-gray-900 dark:text-white mb-2">
              {{ item.productName }}
            </p>
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="label text-xs">Ordenado</label>
                <input :value="item.orderedQty" disabled class="input text-sm bg-gray-100 dark:bg-gray-700" />
              </div>
              <div>
                <label class="label text-xs">Recibir *</label>
                <input v-model.number="item.receivedQty" type="number" min="0" :max="item.orderedQty" step="0.01" class="input text-sm" required />
              </div>
              <div>
                <label class="label text-xs">Lote</label>
                <input v-model="item.lotNumber" class="input text-sm" placeholder="Opcional" />
              </div>
            </div>
          </div>
        </div>
      </form>
      <template #footer>
        <button class="btn-secondary" @click="showReceiveModal = false">Cancelar</button>
        <button class="btn-primary" :disabled="receiving" @click="submitReceive">
          {{ receiving ? 'Procesando...' : 'Confirmar Recepción' }}
        </button>
      </template>
    </AppModal>

    <!-- Cancel Confirm -->
    <ConfirmModal
      v-model="showCancelConfirm"
      title="Cancelar Orden de Compra"
      :message="`¿Cancelar la orden ${purchase?.folio}?`"
      confirm-text="Sí, cancelar"
      variant="danger"
      @confirm="cancelOrder"
    />
  </div>
</template>

<script setup>
import { purchasesApi, warehousesApi } from '@/services/api'
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { ArrowLeftIcon, InboxArrowDownIcon, XCircleIcon } from '@heroicons/vue/24/outline'
import DataTable from '@/components/ui/DataTable.vue'
import AppModal from '@/components/ui/AppModal.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const loading = ref(false)
const receiving = ref(false)
const purchase = ref(null)
const warehouses = ref([])
const showReceiveModal = ref(false)
const showCancelConfirm = ref(false)

const receiveForm = reactive({ warehouseId: '', items: [] })

const itemColumns = [
  { key: 'productCode', label: 'Código' },
  { key: 'productName', label: 'Producto' },
  { key: 'orderedQty', label: 'Cantidad Ordenada' },
  { key: 'receivedQty', label: 'Recibido / Ordenado' },
  { key: 'unitCost', label: 'Costo Unit.' },
  { key: 'subtotal', label: 'Subtotal' },
]

function statusBadge(s) {
  const m = { DRAFT: 'badge-gray', SENT: 'badge-blue', CONFIRMED: 'badge-blue', PARTIAL: 'badge-amber', RECEIVED: 'badge-green', CANCELLED: 'badge-red' }
  return m[s] || 'badge-gray'
}

function statusLabel(s) {
  const m = { DRAFT: 'Borrador', SENT: 'Enviado', CONFIRMED: 'Confirmado', PARTIAL: 'Parcial', RECEIVED: 'Recibido', CANCELLED: 'Cancelado' }
  return m[s] || s
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatCurrency(v) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v || 0)
}

function openReceiveModal() {
  if (!purchase.value) return
  receiveForm.warehouseId = warehouses.value[0]?.id || ''
  receiveForm.items = purchase.value.items.map(i => ({
    itemId: i.id,
    productName: i.productName,
    orderedQty: i.orderedQty,
    receivedQty: i.orderedQty - (i.receivedQty || 0),
    lotNumber: '',
  }))
  showReceiveModal.value = true
}

async function submitReceive() {
  if (!receiveForm.warehouseId) {
    toast.warning('Selecciona el almacén de destino')
    return
  }
  receiving.value = true
  try {
    await purchasesApi.receive(route.params.id, {
      warehouseId: receiveForm.warehouseId,
      items: receiveForm.items,
    })
    toast.success('Material recibido correctamente')
    showReceiveModal.value = false
    fetchPurchase()
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Error al recibir material')
  } finally {
    receiving.value = false
  }
}

async function cancelOrder() {
  try {
    await purchasesApi.cancel(route.params.id)
    toast.success('Orden cancelada')
    fetchPurchase()
  } catch (err) {
    toast.error('Error al cancelar')
  }
}

async function fetchPurchase() {
  loading.value = true
  try {
    const res = await purchasesApi.get(route.params.id)
    purchase.value = res.data
  } catch (err) {
    toast.error('Error al cargar orden de compra')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  const whRes = await warehousesApi.list()
  warehouses.value = whRes.data
  await fetchPurchase()
})
</script>
