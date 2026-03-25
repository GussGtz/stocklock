<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Inventario Actual</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Stock disponible por producto y almacén</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="card">
      <div class="flex flex-wrap gap-3">
        <div class="flex-1 min-w-48">
          <SearchInput v-model="filters.search" placeholder="Buscar por nombre o código..." />
        </div>
        <select v-model="filters.categoryId" class="input w-48">
          <option value="">Todas las categorías</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
        </select>
        <select v-model="filters.warehouseId" class="input w-48">
          <option value="">Todos los almacenes</option>
          <option v-for="wh in warehouses" :key="wh.id" :value="wh.id">{{ wh.name }}</option>
        </select>
      </div>
    </div>

    <!-- Table -->
    <div class="card p-0">
      <DataTable
        :columns="columns"
        :data="stockList"
        :loading="loading"
        :pagination="pagination"
        @page-change="onPageChange"
      >
        <template #cell-status="{ row }">
          <span :class="statusBadge(row)">{{ statusLabel(row) }}</span>
        </template>
        <template #cell-stock="{ row }">
          <span class="font-semibold">{{ row.stock }}</span>
        </template>
        <template #cell-actions="{ row }">
          <div class="flex gap-2">
            <button class="btn-ghost text-xs px-2 py-1" @click="goKardex(row)">
              Ver Kardex
            </button>
            <button class="btn-secondary text-xs px-2 py-1" @click="openAdjust(row)">
              Ajustar
            </button>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Adjustment Modal -->
    <AppModal v-model="showAdjustModal" title="Ajustar Stock" size="md">
      <form @submit.prevent="submitAdjust" class="space-y-4">
        <div>
          <label class="label">Producto</label>
          <input class="input" :value="adjustForm.productName" disabled />
        </div>
        <div>
          <label class="label">Almacén</label>
          <select v-model="adjustForm.warehouseId" class="input" required>
            <option v-for="wh in warehouses" :key="wh.id" :value="wh.id">{{ wh.name }}</option>
          </select>
        </div>
        <div>
          <label class="label">Nueva Cantidad</label>
          <input
            v-model.number="adjustForm.quantity"
            type="number"
            min="0"
            step="0.01"
            class="input"
            required
          />
        </div>
        <div>
          <label class="label">Motivo del Ajuste</label>
          <textarea
            v-model="adjustForm.reason"
            class="input"
            rows="3"
            placeholder="Descripción del ajuste..."
            required
          ></textarea>
        </div>
      </form>
      <template #footer>
        <button class="btn-secondary" @click="showAdjustModal = false">Cancelar</button>
        <button class="btn-primary" :disabled="adjustLoading" @click="submitAdjust">
          <span v-if="adjustLoading">Guardando...</span>
          <span v-else>Ajustar Stock</span>
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { inventoryApi, productsApi, categoriesApi, warehousesApi } from '@/services/api'
import { ref, reactive, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import DataTable from '@/components/ui/DataTable.vue'
import AppModal from '@/components/ui/AppModal.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import { useInventoryStore } from '@/stores/inventory'

const router = useRouter()
const toast = useToast()
const inventoryStore = useInventoryStore()

const loading = ref(false)
const stockList = ref([])
const categories = ref([])
const warehouses = ref([])
const showAdjustModal = ref(false)
const adjustLoading = ref(false)

const pagination = reactive({ page: 1, limit: 20, total: 0 })

const filters = reactive({
  search: '',
  categoryId: '',
  warehouseId: '',
})

const adjustForm = reactive({
  productId: null,
  productName: '',
  warehouseId: '',
  quantity: 0,
  reason: '',
})

const columns = [
  { key: 'code', label: 'Código', sortable: true },
  { key: 'productName', label: 'Producto', sortable: true },
  { key: 'categoryName', label: 'Categoría' },
  { key: 'warehouseName', label: 'Almacén' },
  { key: 'stock', label: 'Stock', sortable: true },
  { key: 'minStock', label: 'Mín' },
  { key: 'maxStock', label: 'Máx' },
  { key: 'status', label: 'Estado' },
  { key: 'actions', label: 'Acciones' },
]

function statusBadge(row) {
  if (row.stock === 0) return 'badge-red'
  if (row.stock < row.minStock) return 'badge-amber'
  if (row.maxStock && row.stock > row.maxStock) return 'badge-blue'
  return 'badge-green'
}

function statusLabel(row) {
  if (row.stock === 0) return 'Sin Stock'
  if (row.stock < row.minStock) return 'Stock Bajo'
  if (row.maxStock && row.stock > row.maxStock) return 'Exceso'
  return 'Normal'
}

function goKardex(row) {
  router.push(`/inventory/kardex/${row.productId}`)
}

function openAdjust(row) {
  adjustForm.productId = row.productId
  adjustForm.productName = row.productName
  adjustForm.warehouseId = row.warehouseId || (warehouses.value[0]?.id ?? '')
  adjustForm.quantity = row.stock
  adjustForm.reason = ''
  showAdjustModal.value = true
}

async function submitAdjust() {
  if (!adjustForm.reason.trim()) {
    toast.warning('El motivo es requerido')
    return
  }
  adjustLoading.value = true
  try {
    await inventoryApi.adjust({
      productId: adjustForm.productId,
      warehouseId: adjustForm.warehouseId,
      quantity: adjustForm.quantity,
      reason: adjustForm.reason,
    })
    toast.success('Stock ajustado correctamente')
    showAdjustModal.value = false
    fetchStock()
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Error al ajustar stock')
  } finally {
    adjustLoading.value = false
  }
}

async function fetchStock() {
  loading.value = true
  try {
    const _ip = { page: pagination.page, limit: pagination.limit }
    if (filters.search) _ip.search = filters.search
    if (filters.categoryId) _ip.categoryId = filters.categoryId
    const res = await productsApi.list(_ip)
    const raw = res.data.data || res.data.items || (Array.isArray(res.data) ? res.data : [])
    stockList.value = raw.map(p => ({
      productId: p.id,
      ...p,
      productName: p.name,
      categoryName: p.category?.name ?? '—',
      warehouseName: 'Almacén Principal',
      stock: p.currentStock ?? 0,
      status: (p.currentStock ?? 0) <= (p.minStock ?? 0) ? 'Bajo' : (p.currentStock ?? 0) >= (p.maxStock ?? Infinity) ? 'Exceso' : 'Normal',
    }))
    if ((res.data.meta?.total ?? res.data.total) !== undefined) pagination.total = res.data.meta?.total ?? res.data.total
  } catch (err) {
    console.error('[Inventory] fetchStock error:', err)
    toast.error('Error al cargar inventario')
  } finally {
    loading.value = false
  }
}

async function fetchMeta() {
  try {
    const [catRes, whRes] = await Promise.all([categoriesApi.list(), warehousesApi.list()])
    categories.value = catRes.data
    warehouses.value = whRes.data
  } catch {}
}

function onPageChange(page) {
  pagination.page = page
  fetchStock()
}

watch(filters, () => {
  pagination.page = 1
  fetchStock()
})

watch(
  () => inventoryStore.realtimeMovements,
  () => fetchStock(),
  { deep: true }
)

onMounted(() => {
  fetchMeta()
  fetchStock()
})
</script>
