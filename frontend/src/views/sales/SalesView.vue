<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Órdenes de Venta</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestión de ventas y pedidos</p>
      </div>
      <button class="btn-primary flex items-center gap-2" @click="openCreate">
        <PlusIcon class="w-4 h-4" />
        Nueva Venta
      </button>
    </div>

    <!-- Filters -->
    <div class="card">
      <div class="flex flex-wrap gap-3">
        <select v-model="filters.status" class="input w-44">
          <option value="">Todos los estados</option>
          <option value="DRAFT">Borrador</option>
          <option value="CONFIRMED">Confirmado</option>
          <option value="PARTIAL">Parcial</option>
          <option value="DELIVERED">Entregado</option>
          <option value="INVOICED">Facturado</option>
          <option value="CANCELLED">Cancelado</option>
        </select>
        <select v-model="filters.customerId" class="input w-48">
          <option value="">Todos los clientes</option>
          <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <select v-model="filters.sectorId" class="input w-44">
          <option value="">Todos los sectores</option>
          <option v-for="s in activeSectors" :key="s.id" :value="s.id">{{ s.name }}</option>
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
        :data="sales"
        :loading="loading"
        :pagination="pagination"
        @page-change="onPageChange"
      >
        <template #cell-status="{ value }">
          <span :class="statusBadge(value)">{{ statusLabel(value) }}</span>
        </template>
        <template #cell-date="{ value }">{{ formatDate(value) }}</template>
        <template #cell-subtotal="{ value }">{{ formatCurrency(value) }}</template>
        <template #cell-discount="{ value }">{{ formatCurrency(value) }}</template>
        <template #cell-tax="{ value }">{{ formatCurrency(value) }}</template>
        <template #cell-total="{ value }">
          <span class="font-semibold">{{ formatCurrency(value) }}</span>
        </template>
        <template #cell-actions="{ row }">
          <div class="flex gap-1">
            <router-link :to="`/sales/${row.id}`" class="btn-ghost text-xs px-2 py-1">
              <EyeIcon class="w-3.5 h-3.5" />
            </router-link>
            <button
              v-if="row.status === 'DRAFT'"
              class="btn-ghost text-xs px-2 py-1 text-blue-600"
              title="Confirmar"
              @click="confirmSale(row)"
            >
              <CheckCircleIcon class="w-3.5 h-3.5" />
            </button>
            <button
              v-if="row.status === 'CONFIRMED'"
              class="btn-ghost text-xs px-2 py-1 text-green-600"
              title="Marcar como entregado"
              @click="deliverSale(row)"
            >
              <TruckIcon class="w-3.5 h-3.5" />
            </button>
            <button
              v-if="!['DELIVERED', 'INVOICED', 'CANCELLED'].includes(row.status)"
              class="btn-ghost text-xs px-2 py-1 text-red-500"
              title="Cancelar"
              @click="confirmCancel(row)"
            >
              <XCircleIcon class="w-3.5 h-3.5" />
            </button>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Create Modal -->
    <AppModal v-model="showCreateModal" title="Nueva Orden de Venta" size="xl">
      <form @submit.prevent="submitCreate" class="space-y-5">

        <!-- Guía de pasos -->
        <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-300">
          <p class="font-semibold mb-1">📋 Pasos para crear una venta:</p>
          <ol class="list-decimal list-inside space-y-0.5">
            <li :class="createForm.customerId ? 'line-through text-blue-400' : ''">Selecciona el <strong>cliente</strong></li>
            <li :class="createForm.items[0]?.productId ? 'line-through text-blue-400' : ''">Elige al menos un <strong>producto</strong> en Artículos</li>
            <li :class="createForm.items.every(i => i.qty > 0) ? 'line-through text-blue-400' : ''">Verifica la <strong>cantidad</strong> (mínimo 1)</li>
            <li :class="createForm.items.every(i => i.unitPrice > 0) ? 'line-through text-blue-400' : ''">Confirma el <strong>precio unitario</strong> (debe ser mayor a $0)</li>
            <li>Haz clic en <strong>Crear Orden</strong></li>
          </ol>
        </div>

        <!-- Errores generales -->
        <div v-if="formErrors._summary" class="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-xl p-3">
          <p class="text-red-700 dark:text-red-300 text-sm font-semibold mb-1">⚠️ Corrige los siguientes errores:</p>
          <ul class="list-disc list-inside space-y-0.5">
            <li v-for="err in formErrors._summary" :key="err" class="text-red-600 dark:text-red-400 text-xs">{{ err }}</li>
          </ul>
        </div>

        <!-- Cliente y Fecha -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Cliente <span class="text-red-500">*</span></label>
            <select
              v-model="createForm.customerId"
              :class="['input', formErrors.customerId ? 'border-red-500 focus:ring-red-400' : '']"
              @change="clearError('customerId')"
            >
              <option value="">— Selecciona un cliente —</option>
              <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
            <p v-if="formErrors.customerId" class="text-red-500 text-xs mt-1 flex items-center gap-1">
              <span>⚠</span> {{ formErrors.customerId }}
            </p>
            <p v-else class="text-gray-400 text-xs mt-1">Elige a quién va dirigida la venta</p>
          </div>
          <div>
            <label class="label">Fecha de Entrega <span class="text-gray-400 text-xs font-normal">(opcional)</span></label>
            <input v-model="createForm.deliveryDate" type="date" class="input" />
            <p class="text-gray-400 text-xs mt-1">¿Cuándo se entregará el pedido?</p>
          </div>
        </div>

        <!-- Sector / Tipo -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Sector de Aplicación <span class="text-gray-400 text-xs font-normal">(opcional)</span></label>
            <select v-model="createForm.sectorId" class="input" @change="onSectorChange">
              <option value="">Sin sector específico</option>
              <option v-for="s in activeSectors" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
            <p class="text-gray-400 text-xs mt-1">Ej: Construcción, Industria...</p>
          </div>
          <div>
            <label class="label">Tipo de Aluminio <span class="text-gray-400 text-xs font-normal">(opcional)</span></label>
            <select v-model="createForm.aluminumTypeId" class="input" :disabled="!createForm.sectorId">
              <option value="">Sin tipo específico</option>
              <option v-for="t in activeTypesForSector" :key="t.id" :value="t.id">{{ t.name }}</option>
            </select>
            <p class="text-gray-400 text-xs mt-1">{{ createForm.sectorId ? 'Elige el tipo de aleación' : 'Primero selecciona un sector' }}</p>
          </div>
        </div>

        <div>
          <label class="label">Notas <span class="text-gray-400 text-xs font-normal">(opcional)</span></label>
          <textarea v-model="createForm.notes" class="input" rows="2" placeholder="Observaciones, instrucciones de entrega, especificaciones especiales..."></textarea>
        </div>

        <!-- Artículos -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <div>
              <label class="label mb-0 font-semibold">Artículos <span class="text-red-500">*</span></label>
              <p class="text-gray-400 text-xs">Agrega los productos que el cliente está comprando</p>
            </div>
            <button type="button" class="btn-ghost text-xs flex items-center gap-1" @click="addItem">
              <PlusIcon class="w-3.5 h-3.5" />
              Agregar línea
            </button>
          </div>

          <!-- Error de artículos -->
          <p v-if="formErrors.items" class="text-red-500 text-xs mb-2 flex items-center gap-1">
            <span>⚠</span> {{ formErrors.items }}
          </p>

          <!-- Header -->
          <div class="hidden md:grid grid-cols-12 gap-2 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide px-1 mb-1">
            <div class="col-span-4">Producto <span class="text-red-400">*</span></div>
            <div class="col-span-1 text-center">Cant. <span class="text-red-400">*</span></div>
            <div class="col-span-2">Precio Unit. <span class="text-red-400">*</span></div>
            <div class="col-span-1 text-center">Dto%</div>
            <div class="col-span-2">Sector/Tipo</div>
            <div class="col-span-1 text-right">Subtotal</div>
            <div class="col-span-1"></div>
          </div>

          <div class="space-y-2">
            <div
              v-for="(item, idx) in createForm.items"
              :key="idx"
              :class="['rounded-lg p-2 border', itemHasError(idx) ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' : 'bg-gray-50 dark:bg-slate-800/50 border-transparent']"
            >
              <div class="grid grid-cols-12 gap-2 items-center">
                <!-- Product -->
                <div class="col-span-4">
                  <select
                    v-model="item.productId"
                    :class="['input text-sm', !item.productId && formErrors._summary ? 'border-red-400' : '']"
                    @change="onProductSelect(item)"
                  >
                    <option value="">— Selecciona producto —</option>
                    <option v-for="p in products" :key="p.id" :value="p.id">{{ p.code }} — {{ p.name }}</option>
                  </select>
                </div>
                <!-- Qty -->
                <div class="col-span-1">
                  <input
                    v-model.number="item.qty"
                    type="number" min="0.01" step="0.01"
                    :class="['input text-sm text-center', (!item.qty || item.qty <= 0) && formErrors._summary ? 'border-red-400' : '']"
                    placeholder="1"
                  />
                </div>
                <!-- Price -->
                <div class="col-span-2">
                  <input
                    v-model.number="item.unitPrice"
                    type="number" min="0" step="0.01"
                    :class="['input text-sm', (!item.unitPrice || item.unitPrice <= 0) && formErrors._summary ? 'border-red-400' : '']"
                    placeholder="0.00"
                  />
                </div>
                <!-- Discount -->
                <div class="col-span-1">
                  <input v-model.number="item.discount" type="number" min="0" max="100" step="0.1" class="input text-sm text-center" placeholder="0" />
                </div>
                <!-- Sector/Type -->
                <div class="col-span-2">
                  <div v-if="item.sectorName || item.typeName" class="text-xs text-gray-500 dark:text-gray-400 truncate leading-tight">
                    <div v-if="item.sectorName" class="font-medium text-primary-600 dark:text-primary-400 truncate">{{ item.sectorName }}</div>
                    <div v-if="item.typeName" class="truncate">{{ item.typeName }}</div>
                  </div>
                  <div v-else class="text-xs text-gray-300 dark:text-gray-600 italic">—</div>
                </div>
                <!-- Subtotal -->
                <div class="col-span-1 text-right text-sm font-medium" :class="itemSubtotal(item) > 0 ? 'text-slate-700 dark:text-gray-300' : 'text-red-400'">
                  {{ formatCurrency(itemSubtotal(item)) }}
                </div>
                <!-- Remove -->
                <button type="button" class="col-span-1 btn-ghost p-1.5 text-red-400 hover:text-red-600 justify-center" @click="removeItem(idx)" :disabled="createForm.items.length === 1">
                  <XMarkIcon class="w-4 h-4" />
                </button>
              </div>
              <!-- Item error hint -->
              <p v-if="itemHasError(idx)" class="text-red-500 text-xs mt-1 pl-1">
                ⚠
                <span v-if="!item.productId"> Selecciona un producto.</span>
                <span v-else-if="!item.qty || item.qty <= 0"> La cantidad debe ser mayor a 0.</span>
                <span v-else-if="!item.unitPrice || item.unitPrice <= 0"> El precio unitario debe ser mayor a $0.</span>
              </p>
            </div>
          </div>
        </div>

        <!-- Totals -->
        <div class="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 text-sm space-y-1.5 border border-gray-200 dark:border-slate-700">
          <div class="flex justify-between text-gray-600 dark:text-gray-400">
            <span>Subtotal</span><span>{{ formatCurrency(saleSubtotal) }}</span>
          </div>
          <div class="flex justify-between text-gray-600 dark:text-gray-400">
            <span>Descuento</span><span class="text-red-500">-{{ formatCurrency(saleDiscount) }}</span>
          </div>
          <div class="flex justify-between text-gray-600 dark:text-gray-400">
            <span>IVA (16%)</span><span>{{ formatCurrency(saleTax) }}</span>
          </div>
          <div class="flex justify-between font-bold text-base border-t border-gray-200 dark:border-gray-600 pt-2 mt-1 text-slate-900 dark:text-white">
            <span>Total</span><span>{{ formatCurrency(saleTotal) }}</span>
          </div>
          <p v-if="saleTotal <= 0" class="text-amber-600 text-xs text-center pt-1">
            ⚠ El total es $0. Verifica precios y cantidades.
          </p>
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
      title="Cancelar Venta"
      :message="`¿Cancelar la orden ${cancelingItem?.folio}? Si está confirmada, el stock será devuelto.`"
      confirm-text="Sí, Cancelar"
      variant="danger"
      @confirm="cancelSale"
    />
  </div>
</template>

<script setup>
import { salesApi, customersApi, productsApi, sectorsApi } from '@/services/api'
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { PlusIcon, EyeIcon, CheckCircleIcon, TruckIcon, XCircleIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import DataTable from '@/components/ui/DataTable.vue'
import AppModal from '@/components/ui/AppModal.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'

const toast = useToast()
const loading = ref(false)
const saving = ref(false)
const sales = ref([])
const customers = ref([])
const products = ref([])
const sectors = ref([])
const showCreateModal = ref(false)
const showConfirmCancel = ref(false)
const cancelingItem = ref(null)
const formErrors = reactive({ customerId: '', items: '', _summary: null })

const pagination = reactive({ page: 1, limit: 20, total: 0 })
const filters = reactive({ status: '', customerId: '', sectorId: '', dateFrom: '', dateTo: '' })

const activeSectors = computed(() => sectors.value.filter(s => s.isActive))
const activeTypesForSector = computed(() => {
  if (!createForm.sectorId) return []
  const sec = sectors.value.find(s => s.id === createForm.sectorId)
  return sec?.types?.filter(t => t.isActive) ?? []
})

const defaultItem = () => ({
  productId: '', qty: 1, unitPrice: 0, discount: 0, cuts: '',
  sectorName: '', typeName: '',
})

const createForm = reactive({
  customerId: '', deliveryDate: '', notes: '',
  sectorId: '', aluminumTypeId: '',
  items: [defaultItem()],
})

const columns = [
  { key: 'folio', label: 'Folio', sortable: true },
  { key: 'date', label: 'Fecha', sortable: true },
  { key: 'customerName', label: 'Cliente' },
  { key: 'itemCount', label: 'Artículos' },
  { key: 'subtotal', label: 'Subtotal' },
  { key: 'discount', label: 'Descuento' },
  { key: 'tax', label: 'IVA' },
  { key: 'total', label: 'Total' },
  { key: 'status', label: 'Estado' },
  { key: 'actions', label: '' },
]

function itemSubtotal(item) {
  const base = (item.qty || 0) * (item.unitPrice || 0)
  return base - base * ((item.discount || 0) / 100)
}

const saleSubtotal = computed(() => createForm.items.reduce((s, i) => s + (i.qty || 0) * (i.unitPrice || 0), 0))
const saleDiscount = computed(() => createForm.items.reduce((s, i) => {
  const base = (i.qty || 0) * (i.unitPrice || 0)
  return s + base * ((i.discount || 0) / 100)
}, 0))
const saleTax = computed(() => (saleSubtotal.value - saleDiscount.value) * 0.16)
const saleTotal = computed(() => saleSubtotal.value - saleDiscount.value + saleTax.value)

function statusBadge(s) {
  const m = { DRAFT: 'badge-gray', CONFIRMED: 'badge-blue', PARTIAL: 'badge-amber', DELIVERED: 'badge-green', INVOICED: 'badge-blue', CANCELLED: 'badge-red' }
  return m[s] || 'badge-gray'
}

function statusLabel(s) {
  const m = { DRAFT: 'Borrador', CONFIRMED: 'Confirmado', PARTIAL: 'Parcial', DELIVERED: 'Entregado', INVOICED: 'Facturado', CANCELLED: 'Cancelado' }
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
function removeItem(idx) {
  if (createForm.items.length > 1) createForm.items.splice(idx, 1)
}

function onSectorChange() {
  createForm.aluminumTypeId = ''
}

function onProductSelect(item) {
  const p = products.value.find(p => p.id === item.productId)
  if (p) {
    item.unitPrice = p.salePrice || 0
    item.sectorName = p.sector?.name || ''
    item.typeName = p.aluminumType?.name || ''
    // If no global sector set, suggest from product
    if (!createForm.sectorId && p.sectorId) {
      createForm.sectorId = p.sectorId
    }
  } else {
    item.sectorName = ''
    item.typeName = ''
  }
}

function clearError(field) {
  formErrors[field] = ''
  formErrors._summary = null
}

function itemHasError(idx) {
  if (!formErrors._summary) return false
  const item = createForm.items[idx]
  return !item.productId || !item.qty || item.qty <= 0 || !item.unitPrice || item.unitPrice <= 0
}

function validateForm() {
  const errors = []
  formErrors.customerId = ''
  formErrors.items = ''
  formErrors._summary = null

  if (!createForm.customerId) {
    formErrors.customerId = 'Debes seleccionar un cliente para continuar'
    errors.push('Falta seleccionar el cliente')
  }

  const itemErrors = []
  createForm.items.forEach((item, idx) => {
    const n = idx + 1
    if (!item.productId) itemErrors.push(`Artículo ${n}: selecciona un producto`)
    else if (!item.qty || item.qty <= 0) itemErrors.push(`Artículo ${n}: la cantidad debe ser mayor a 0`)
    else if (!item.unitPrice || item.unitPrice <= 0) itemErrors.push(`Artículo ${n}: el precio debe ser mayor a $0`)
  })

  if (itemErrors.length) {
    formErrors.items = 'Hay artículos con información incompleta'
    errors.push(...itemErrors)
  }

  if (errors.length) {
    formErrors._summary = errors
    return false
  }
  return true
}

function openCreate() {
  Object.assign(createForm, {
    customerId: '', deliveryDate: '', notes: '',
    sectorId: '', aluminumTypeId: '',
    items: [defaultItem()],
  })
  formErrors.customerId = ''
  formErrors.items = ''
  formErrors._summary = null
  showCreateModal.value = true
}

async function confirmSale(row) {
  try {
    await salesApi.confirm(row.id)
    toast.success('Venta confirmada — stock descontado')
    fetchSales()
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Error al confirmar venta')
  }
}

async function deliverSale(row) {
  try {
    await salesApi.deliver(row.id)
    toast.success('Venta marcada como entregada')
    fetchSales()
  } catch (err) {
    toast.error('Error al marcar entrega')
  }
}

function confirmCancel(row) {
  cancelingItem.value = row
  showConfirmCancel.value = true
}

async function cancelSale() {
  try {
    await salesApi.cancel(cancelingItem.value.id)
    toast.success('Venta cancelada')
    fetchSales()
  } catch (err) {
    toast.error('Error al cancelar venta')
  }
}

async function submitCreate() {
  if (!validateForm()) return
  saving.value = true
  try {
    const payload = {
      customerId: createForm.customerId,
      deliveryDate: createForm.deliveryDate ? createForm.deliveryDate + 'T00:00:00.000Z' : undefined,
      notes: createForm.notes || undefined,
      items: createForm.items.map(i => ({
        productId: i.productId,
        quantity: i.qty,
        unitPrice: i.unitPrice,
        discount: i.discount || 0,
        cuts: i.cuts ? { raw: i.cuts } : undefined,
      })),
    }
    await salesApi.create(payload)
    toast.success('Orden de venta creada')
    showCreateModal.value = false
    fetchSales()
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Error al crear venta')
  } finally {
    saving.value = false
  }
}

async function fetchSales() {
  loading.value = true
  try {
    const params = { page: pagination.page, limit: pagination.limit }
    if (filters.status) params.status = filters.status
    if (filters.customerId) params.customerId = filters.customerId
    if (filters.dateFrom) params.dateFrom = filters.dateFrom
    if (filters.dateTo) params.dateTo = filters.dateTo
    const res = await salesApi.list(params)
    const rawS = res.data.data || res.data.items || (Array.isArray(res.data) ? res.data : [])
    sales.value = rawS.map(s => ({
      ...s,
      customerName: s.customer?.name ?? '—',
      itemCount: s.items?.length ?? s._count?.items ?? 0,
      date: s.saleDate ?? s.deliveryDate ?? s.createdAt,
    }))
    if ((res.data.meta?.total ?? res.data.total) !== undefined) pagination.total = res.data.meta?.total ?? res.data.total
  } catch (err) {
    toast.error('Error al cargar ventas')
  } finally {
    loading.value = false
  }
}

function onPageChange(p) { pagination.page = p; fetchSales() }
watch(filters, () => { pagination.page = 1; fetchSales() })

onMounted(async () => {
  try {
    const [cRes, pRes, sRes] = await Promise.all([
      customersApi.list(),
      productsApi.list({ limit: 500, isActive: 'true' }),
      sectorsApi.list(),
    ])
    customers.value = cRes.data.items || cRes.data.data || (Array.isArray(cRes.data) ? cRes.data : [])
    products.value = pRes.data.data || pRes.data.items || (Array.isArray(pRes.data) ? pRes.data : [])
    sectors.value = Array.isArray(sRes.data) ? sRes.data : []
  } catch (err) {
    console.error('[Sales] init error', err)
  }
  fetchSales()
})
</script>
