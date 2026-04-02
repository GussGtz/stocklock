<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Órdenes de Compra</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestión de compras a proveedores</p>
      </div>
      <button class="btn-primary flex items-center gap-2" @click="openCreate">
        <PlusIcon class="w-4 h-4" />
        Nueva Compra
      </button>
    </div>

    <!-- Filters -->
    <div class="card">
      <div class="flex flex-wrap gap-3">
        <select v-model="filters.status" class="input w-44">
          <option value="">Todos los estados</option>
          <option value="DRAFT">Borrador</option>
          <option value="SENT">Enviado</option>
          <option value="CONFIRMED">Confirmado</option>
          <option value="PARTIAL">Parcial</option>
          <option value="RECEIVED">Recibido</option>
          <option value="CANCELLED">Cancelado</option>
        </select>
        <select v-model="filters.supplierId" class="input w-48">
          <option value="">Todos los proveedores</option>
          <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
        <input v-model="filters.dateFrom" type="date" class="input w-40" />
        <span class="text-gray-400 self-center text-sm">al</span>
        <input v-model="filters.dateTo" type="date" class="input w-40" />
      </div>
    </div>

    <!-- Table -->
    <div class="card p-0">
      <DataTable
        :columns="columns"
        :data="purchases"
        :loading="loading"
        :pagination="pagination"
        @page-change="onPageChange"
      >
        <template #cell-status="{ value }">
          <span :class="statusBadge(value)">{{ statusLabel(value) }}</span>
        </template>
        <template #cell-date="{ value }">{{ formatDate(value) }}</template>
        <template #cell-subtotal="{ value }">{{ formatCurrency(value) }}</template>
        <template #cell-tax="{ value }">{{ formatCurrency(value) }}</template>
        <template #cell-total="{ value }">
          <span class="font-semibold">{{ formatCurrency(value) }}</span>
        </template>
        <template #cell-actions="{ row }">
          <div class="flex gap-1">
            <router-link :to="`/purchases/${row.id}`" class="btn-ghost text-xs px-2 py-1">
              <EyeIcon class="w-3.5 h-3.5" />
            </router-link>
            <button
              v-if="!['RECEIVED', 'CANCELLED'].includes(row.status)"
              class="btn-ghost text-xs px-2 py-1 text-green-600"
              title="Recibir material"
              @click="openReceive(row)"
            >
              <InboxArrowDownIcon class="w-3.5 h-3.5" />
            </button>
            <button
              v-if="!['RECEIVED', 'CANCELLED'].includes(row.status)"
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
    <AppModal v-model="showCreateModal" title="Nueva Orden de Compra" size="xl">
      <form @submit.prevent="submitCreate" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Proveedor *</label>
            <select v-model="createForm.supplierId" class="input" required>
              <option value="">Seleccionar...</option>
              <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>
          <div>
            <label class="label">Fecha Esperada</label>
            <input v-model="createForm.expectedDate" type="date" class="input" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Moneda</label>
            <select v-model="createForm.currency" class="input">
              <option value="MXN">MXN</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div>
            <label class="label">Tipo de Cambio</label>
            <input v-model.number="createForm.exchangeRate" type="number" step="0.0001" min="0" class="input" />
          </div>
        </div>
        <div>
          <label class="label">Notas</label>
          <textarea v-model="createForm.notes" class="input" rows="2"></textarea>
        </div>

        <!-- Items -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="label mb-0">Artículos</label>
            <button type="button" class="btn-ghost text-xs" @click="addItem">
              <PlusIcon class="w-3.5 h-3.5 inline" /> Agregar
            </button>
          </div>
          <div class="space-y-2">
            <div
              v-for="(item, idx) in createForm.items"
              :key="idx"
              class="flex gap-2 items-end"
            >
              <div class="flex-1">
                <select v-model="item.productId" class="input text-sm" @change="onProductSelect(item)">
                  <option value="">Producto...</option>
                  <option v-for="p in products" :key="p.id" :value="p.id">{{ p.code }} - {{ p.name }}</option>
                </select>
              </div>
              <div class="w-24">
                <input v-model.number="item.qty" type="number" min="0.01" step="0.01" class="input text-sm" placeholder="Cant." />
              </div>
              <div class="w-32">
                <input v-model.number="item.unitCost" type="number" min="0" step="0.01" class="input text-sm" placeholder="Costo" />
              </div>
              <div class="w-28 text-right text-sm text-gray-600 dark:text-gray-300 pb-2">
                {{ formatCurrency((item.qty || 0) * (item.unitCost || 0)) }}
              </div>
              <button type="button" class="btn-ghost p-1.5 text-red-500 pb-2" @click="removeItem(idx)">
                <XMarkIcon class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- Totals -->
        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-sm space-y-1">
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Subtotal</span>
            <span>{{ formatCurrency(createSubtotal) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">IVA (16%)</span>
            <span>{{ formatCurrency(createSubtotal * 0.16) }}</span>
          </div>
          <div class="flex justify-between font-bold text-base border-t border-gray-200 dark:border-gray-600 pt-1 mt-1">
            <span>Total</span>
            <span>{{ formatCurrency(createSubtotal * 1.16) }}</span>
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
      :message="`¿Cancelar la orden ${cancelingItem?.folio}? Esta acción no se puede deshacer.`"
      confirm-text="Cancelar Orden"
      variant="danger"
      @confirm="cancelPurchase"
    />
  </div>
</template>

<script setup>
import { purchasesApi, suppliersApi, productsApi } from '@/services/api'
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import {
  PlusIcon, EyeIcon, InboxArrowDownIcon, XCircleIcon, XMarkIcon,
} from '@heroicons/vue/24/outline'
import DataTable from '@/components/ui/DataTable.vue'
import AppModal from '@/components/ui/AppModal.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'

const toast = useToast()
const loading = ref(false)
const saving = ref(false)
const purchases = ref([])
const suppliers = ref([])
const products = ref([])
const showCreateModal = ref(false)
const showConfirmCancel = ref(false)
const cancelingItem = ref(null)

const pagination = reactive({ page: 1, limit: 20, total: 0 })
const filters = reactive({ status: '', supplierId: '', dateFrom: '', dateTo: '' })

const defaultItem = () => ({ productId: '', qty: 1, unitCost: 0 })
const createForm = reactive({
  supplierId: '', expectedDate: '', currency: 'MXN', exchangeRate: 1, notes: '',
  items: [defaultItem()],
})

const columns = [
  { key: 'folio', label: 'Folio', sortable: true },
  { key: 'date', label: 'Fecha', sortable: true },
  { key: 'supplierName', label: 'Proveedor' },
  { key: 'itemCount', label: 'Artículos' },
  { key: 'subtotal', label: 'Subtotal' },
  { key: 'tax', label: 'IVA' },
  { key: 'total', label: 'Total' },
  { key: 'status', label: 'Estado' },
  { key: 'actions', label: 'Acciones' },
]

const createSubtotal = computed(() =>
  createForm.items.reduce((s, i) => s + (i.qty || 0) * (i.unitCost || 0), 0)
)

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

function addItem() { createForm.items.push(defaultItem()) }
function removeItem(idx) { createForm.items.splice(idx, 1) }

function onProductSelect(item) {
  const p = products.value.find(p => p.id === item.productId)
  if (p) item.unitCost = p.costPrice || 0
}

function openCreate() {
  Object.assign(createForm, {
    supplierId: '', expectedDate: '', currency: 'MXN', exchangeRate: 1, notes: '',
    items: [defaultItem()],
  })
  showCreateModal.value = true
}

function openReceive(row) {
  window.location.href = `/purchases/${row.id}`
}

function confirmCancel(row) {
  cancelingItem.value = row
  showConfirmCancel.value = true
}

async function cancelPurchase() {
  try {
    await purchasesApi.cancel(cancelingItem.value.id)
    toast.success('Orden cancelada')
    fetchPurchases()
  } catch (err) {
    toast.error('Error al cancelar orden')
  }
}

async function submitCreate() {
  if (!createForm.supplierId || createForm.items.some(i => !i.productId || !i.qty)) {
    toast.warning('Completa los campos requeridos e ítems')
    return
  }
  saving.value = true
  try {
    const payload = {
      supplierId: createForm.supplierId,
      expectedDate: createForm.expectedDate ? createForm.expectedDate + 'T00:00:00.000Z' : undefined,
      currency: createForm.currency,
      exchangeRate: createForm.exchangeRate,
      notes: createForm.notes || undefined,
      items: createForm.items.map(i => ({
        productId: i.productId,
        orderedQty: i.qty,
        unitCost: i.unitCost,
      })),
    }
    await purchasesApi.create(payload)
    toast.success('Orden de compra creada')
    showCreateModal.value = false
    fetchPurchases()
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Error al crear orden')
  } finally {
    saving.value = false
  }
}

async function fetchPurchases() {
  loading.value = true
  try {
    const res = await purchasesApi.list({
      page: pagination.page,
      limit: pagination.limit,
      status: filters.status || undefined,
      supplierId: filters.supplierId || undefined,
      from: filters.dateFrom || undefined,
      to: filters.dateTo || undefined,
    })
    const rawP = res.data.data || res.data.items || (Array.isArray(res.data) ? res.data : [])
    purchases.value = rawP.map(p => ({
      ...p,
      supplierName: p.supplier?.name ?? '—',
      itemCount: p.items?.length ?? p._count?.items ?? 0,
      date: p.expectedDate ?? p.createdAt,
    }))
    if ((res.data.meta?.total ?? res.data.total) !== undefined) pagination.total = res.data.meta?.total ?? res.data.total
  } catch (err) {
    toast.error('Error al cargar compras')
  } finally {
    loading.value = false
  }
}

function onPageChange(p) { pagination.page = p; fetchPurchases() }
watch(filters, () => { pagination.page = 1; fetchPurchases() })

onMounted(async () => {
  const [sRes, pRes] = await Promise.all([suppliersApi.list({ limit: 500 }), productsApi.list({ limit: 500 })])
  suppliers.value = sRes.data.data || sRes.data.items || (Array.isArray(sRes.data) ? sRes.data : [])
  products.value = pRes.data.data || pRes.data.items || (Array.isArray(pRes.data) ? pRes.data : [])
  fetchPurchases()
})
</script>
