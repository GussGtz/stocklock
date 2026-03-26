<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Movimientos de Inventario</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Historial de entradas, salidas y ajustes</p>
      </div>
      <button class="btn-secondary flex items-center gap-2" :disabled="exportLoading" @click="exportData">
        <ArrowDownTrayIcon class="w-4 h-4" />
        {{ exportLoading ? 'Exportando...' : 'Exportar Excel' }}
      </button>
    </div>

    <!-- Filters -->
    <div class="card">
      <div class="flex flex-wrap gap-3">
        <div class="flex-1 min-w-48">
          <SearchInput v-model="filters.search" placeholder="Buscar por producto..." />
        </div>
        <select v-model="filters.type" class="input w-44">
          <option value="">Todos los tipos</option>
          <option value="ENTRY">Entrada</option>
          <option value="EXIT">Salida</option>
          <option value="ADJUSTMENT">Ajuste</option>
          <option value="TRANSFER">Transferencia</option>
        </select>
        <div class="flex items-center gap-2">
          <input v-model="filters.dateFrom" type="date" class="input w-40" />
          <span class="text-gray-400 text-sm">al</span>
          <input v-model="filters.dateTo" type="date" class="input w-40" />
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="card p-0">
      <DataTable
        :columns="columns"
        :data="movements"
        :loading="loading"
        :pagination="pagination"
        @page-change="onPageChange"
        @sort-change="onSortChange"
      >
        <template #cell-type="{ value }">
          <span :class="typeBadge(value)">{{ typeLabel(value) }}</span>
        </template>
        <template #cell-date="{ value }">
          {{ formatDate(value) }}
        </template>
        <template #cell-qty="{ row }">
          <span :class="row.qty > 0 ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold'">
            {{ row.qty > 0 ? '+' : '' }}{{ row.qty }}
          </span>
        </template>
        <template #cell-cost="{ value }">
          {{ value ? formatCurrency(value) : '—' }}
        </template>
      </DataTable>
    </div>
  </div>
</template>

<script setup>
import { inventoryApi, reportsApi } from '@/services/api'
import { ref, reactive, watch, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { ArrowDownTrayIcon } from '@heroicons/vue/24/outline'
import DataTable from '@/components/ui/DataTable.vue'
import SearchInput from '@/components/ui/SearchInput.vue'

const toast = useToast()
const loading = ref(false)
const exportLoading = ref(false)
const movements = ref([])

const pagination = reactive({ page: 1, limit: 25, total: 0 })
const sortState = reactive({ key: 'date', dir: 'desc' })

const filters = reactive({
  search: '',
  type: '',
  dateFrom: '',
  dateTo: '',
})

const columns = [
  { key: 'date', label: 'Fecha', sortable: true },
  { key: 'type', label: 'Tipo' },
  { key: 'productName', label: 'Producto' },
  { key: 'warehouseName', label: 'Almacén' },
  { key: 'qty', label: 'Cantidad', sortable: true },
  { key: 'cost', label: 'Costo Unit.' },
  { key: 'userName', label: 'Usuario' },
  { key: 'notes', label: 'Notas' },
]

function typeBadge(type) {
  const map = {
    ENTRY: 'badge-green',
    EXIT: 'badge-red',
    ADJUSTMENT: 'badge-blue',
    TRANSFER: 'badge-amber',
  }
  return map[type] || 'badge-gray'
}

function typeLabel(type) {
  const map = {
    ENTRY: 'Entrada',
    EXIT: 'Salida',
    ADJUSTMENT: 'Ajuste',
    TRANSFER: 'Transferencia',
  }
  return map[type] || type
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatCurrency(v) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v)
}

async function fetchMovements() {
  loading.value = true
  try {
    const res = await inventoryApi.movements({
      page: pagination.page,
      limit: pagination.limit,
      type: filters.type || undefined,
      from: filters.dateFrom || undefined,
      to: filters.dateTo || undefined,
    })
    const rawMov = res.data.data || res.data.items || (Array.isArray(res.data) ? res.data : [])
    const exitTypes = ['EXIT', 'PRODUCTION_OUT', 'TRANSFER']
    movements.value = rawMov.map(m => ({
      ...m,
      date: m.createdAt,
      productName: m.product?.name ?? '—',
      warehouseName: m.warehouse?.name ?? '—',
      qty: exitTypes.includes(m.type) ? -Math.abs(Number(m.quantity)) : Math.abs(Number(m.quantity)),
      cost: m.unitCost,
      userName: m.user ? m.user.firstName + ' ' + m.user.lastName : '—',
    }))
    if ((res.data.meta?.total ?? res.data.total) !== undefined) pagination.total = res.data.meta?.total ?? res.data.total
  } catch (err) {
    toast.error('Error al cargar movimientos')
  } finally {
    loading.value = false
  }
}

async function exportData() {
  exportLoading.value = true
  try {
    await reportsApi.export('movements', {
      search: filters.search,
      type: filters.type,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    })
    toast.success('Exportación iniciada')
  } catch (err) {
    toast.error('Error al exportar')
  } finally {
    exportLoading.value = false
  }
}

function onPageChange(page) {
  pagination.page = page
  fetchMovements()
}

function onSortChange(sort) {
  sortState.key = sort.key
  sortState.dir = sort.dir
  fetchMovements()
}

watch(filters, () => {
  pagination.page = 1
  fetchMovements()
})

onMounted(fetchMovements)
</script>
