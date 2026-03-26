<template>
  <div class="space-y-6">
    <!-- Back + Header -->
    <div class="page-header">
      <div class="flex items-center gap-4">
        <button class="btn-ghost p-2 rounded-lg" @click="$router.push('/inventory')">
          <ArrowLeftIcon class="w-5 h-5" />
        </button>
        <div>
          <h1 class="page-title">Kardex</h1>
          <p v-if="product" class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {{ product.code }} — {{ product.name }}
          </p>
        </div>
      </div>

      <!-- Stock summary cards -->
      <div v-if="product" class="flex gap-4">
        <div class="card px-4 py-2 text-center min-w-28">
          <p class="text-xs text-gray-500 dark:text-gray-400">Stock Actual</p>
          <p class="text-xl font-bold text-blue-600 dark:text-blue-400">{{ product.stock }}</p>
        </div>
        <div class="card px-4 py-2 text-center min-w-28">
          <p class="text-xs text-gray-500 dark:text-gray-400">Valor Total</p>
          <p class="text-xl font-bold text-green-600 dark:text-green-400">{{ formatCurrency(product.totalValue) }}</p>
        </div>
      </div>
    </div>

    <!-- Skeleton product header -->
    <div v-if="loadingProduct" class="card flex gap-4 animate-pulse">
      <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
      <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
    </div>

    <!-- Date Filters -->
    <div class="card">
      <div class="flex flex-wrap gap-3 items-center">
        <label class="label mb-0">Período:</label>
        <input v-model="filters.dateFrom" type="date" class="input w-40" />
        <span class="text-gray-400 text-sm">al</span>
        <input v-model="filters.dateTo" type="date" class="input w-40" />
        <button class="btn-primary" @click="fetchKardex">Filtrar</button>
        <button class="btn-ghost" @click="clearFilters">Limpiar</button>
      </div>
    </div>

    <!-- Kardex Table -->
    <div class="card p-0">
      <DataTable
        :columns="columns"
        :data="kardex"
        :loading="loading"
        :pagination="pagination"
        @page-change="onPageChange"
      >
        <template #cell-date="{ value }">
          {{ formatDate(value) }}
        </template>
        <template #cell-entry="{ value }">
          <span v-if="value" class="text-green-600 font-semibold">+{{ value }}</span>
          <span v-else class="text-gray-300 dark:text-gray-600">—</span>
        </template>
        <template #cell-exit="{ value }">
          <span v-if="value" class="text-red-500 font-semibold">-{{ value }}</span>
          <span v-else class="text-gray-300 dark:text-gray-600">—</span>
        </template>
        <template #cell-adjust="{ value }">
          <span v-if="value !== null && value !== undefined && value !== 0" class="text-blue-500 font-semibold">
            {{ value > 0 ? '+' : '' }}{{ value }}
          </span>
          <span v-else class="text-gray-300 dark:text-gray-600">—</span>
        </template>
        <template #cell-balance="{ value }">
          <span class="font-bold text-gray-900 dark:text-white bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">
            {{ value }}
          </span>
        </template>
        <template #cell-unitCost="{ value }">
          {{ value ? formatCurrency(value) : '—' }}
        </template>
        <template #cell-totalValue="{ value }">
          {{ value ? formatCurrency(value) : '—' }}
        </template>
      </DataTable>
    </div>
  </div>
</template>

<script setup>
import { inventoryApi, productsApi } from '@/services/api'
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import DataTable from '@/components/ui/DataTable.vue'

const route = useRoute()
const toast = useToast()

const loading = ref(false)
const loadingProduct = ref(false)
const product = ref(null)
const kardex = ref([])

const pagination = reactive({ page: 1, limit: 30, total: 0 })

const filters = reactive({
  dateFrom: '',
  dateTo: '',
})

const columns = [
  { key: 'date', label: 'Fecha' },
  { key: 'description', label: 'Descripción' },
  { key: 'entry', label: 'Entrada' },
  { key: 'exit', label: 'Salida' },
  { key: 'adjust', label: 'Ajuste' },
  { key: 'balance', label: 'Saldo' },
  { key: 'unitCost', label: 'Costo Unit.' },
  { key: 'totalValue', label: 'Valor Total' },
]

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

function clearFilters() {
  filters.dateFrom = ''
  filters.dateTo = ''
  fetchKardex()
}

async function fetchProduct() {
  loadingProduct.value = true
  try {
    const res = await productsApi.get(route.params.productId)
    product.value = res.data
  } catch (err) {
    toast.error('Error al cargar producto')
  } finally {
    loadingProduct.value = false
  }
}

async function fetchKardex() {
  loading.value = true
  try {
    const res = await inventoryApi.kardex(route.params.productId, {
      from: filters.dateFrom || undefined,
      to: filters.dateTo || undefined,
    })
    // Backend returns { product, entries } — map fields to column keys
    const rawEntries = res.data.entries || res.data.data || res.data.items || (Array.isArray(res.data) ? res.data : [])
    kardex.value = rawEntries.map(e => ({
      ...e,
      entry: e.entryQty,
      exit: e.exitQty,
      adjust: e.adjustQty,
    }))
    pagination.total = rawEntries.length
    // Override product from kardex response if available
    if (res.data.product && !product.value) product.value = {
      ...res.data.product,
      stock: res.data.product.currentStock ?? res.data.product.stock,
      totalValue: res.data.product.totalValue ?? 0,
    }
  } catch (err) {
    toast.error('Error al cargar kardex')
  } finally {
    loading.value = false
  }
}

function onPageChange(page) {
  pagination.page = page
  fetchKardex()
}

onMounted(() => {
  fetchProduct()
  fetchKardex()
})
</script>
