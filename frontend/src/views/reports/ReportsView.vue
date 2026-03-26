<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Reportes</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Análisis e indicadores del negocio</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="border-b border-gray-200 dark:border-gray-700">
      <nav class="-mb-px flex gap-6">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="py-3 text-sm font-medium border-b-2 transition-colors"
          :class="activeTab === tab.key
            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </nav>
    </div>

    <!-- Inventory Report -->
    <div v-if="activeTab === 'inventory'" class="space-y-4">
      <div class="flex justify-end">
        <button class="btn-secondary flex items-center gap-2" :disabled="exportLoading" @click="exportReport('inventory')">
          <ArrowDownTrayIcon class="w-4 h-4" />
          Exportar Excel
        </button>
      </div>
      <div class="card p-0">
        <DataTable
          :columns="inventoryCols"
          :data="inventoryReport"
          :loading="reportLoading"
          :pagination="invPagination"
          @page-change="p => { invPagination.page = p; fetchInventoryReport() }"
        >
          <template #cell-totalValue="{ value }">{{ formatCurrency(value) }}</template>
          <template #cell-lastMovement="{ value }">{{ formatDate(value) }}</template>
          <template #cell-status="{ row }">
            <span :class="stockStatus(row).badge">{{ stockStatus(row).label }}</span>
          </template>
        </DataTable>
      </div>
    </div>

    <!-- Sales Report -->
    <div v-else-if="activeTab === 'sales'" class="space-y-4">
      <div class="flex flex-wrap gap-3 items-center">
        <input v-model="salesFilters.dateFrom" type="date" class="input w-40" @change="fetchSalesReport" />
        <span class="text-gray-400 text-sm">al</span>
        <input v-model="salesFilters.dateTo" type="date" class="input w-40" @change="fetchSalesReport" />
        <button class="btn-secondary flex items-center gap-2 ml-auto" :disabled="exportLoading" @click="exportReport('sales')">
          <ArrowDownTrayIcon class="w-4 h-4" />
          Exportar Excel
        </button>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="card text-center">
          <p class="text-sm text-gray-500 dark:text-gray-400">Total Órdenes</p>
          <p class="text-3xl font-bold text-blue-600 dark:text-blue-400">{{ salesSummary.totalOrders || 0 }}</p>
        </div>
        <div class="card text-center">
          <p class="text-sm text-gray-500 dark:text-gray-400">Ingresos</p>
          <p class="text-3xl font-bold text-green-600 dark:text-green-400">{{ formatCurrency(salesSummary.totalRevenue) }}</p>
        </div>
        <div class="card text-center">
          <p class="text-sm text-gray-500 dark:text-gray-400">Top Cliente</p>
          <p class="text-lg font-bold text-gray-900 dark:text-white">{{ salesSummary.topCustomer || '—' }}</p>
        </div>
      </div>

      <!-- Bar Chart -->
      <div class="card">
        <h3 class="font-semibold mb-4 text-gray-900 dark:text-white">Ventas por Día</h3>
        <div v-if="reportLoading" class="h-48 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
        <Bar v-else-if="salesChartData" :data="salesChartData" :options="barOptions" class="max-h-64" />
        <p v-else class="text-gray-400 text-center py-8">Sin datos para mostrar</p>
      </div>
    </div>

    <!-- Purchases Report -->
    <div v-else-if="activeTab === 'purchases'" class="space-y-4">
      <div class="flex flex-wrap gap-3 items-center">
        <input v-model="purchFilters.dateFrom" type="date" class="input w-40" @change="fetchPurchasesReport" />
        <span class="text-gray-400 text-sm">al</span>
        <input v-model="purchFilters.dateTo" type="date" class="input w-40" @change="fetchPurchasesReport" />
        <button class="btn-secondary flex items-center gap-2 ml-auto" :disabled="exportLoading" @click="exportReport('purchases')">
          <ArrowDownTrayIcon class="w-4 h-4" />
          Exportar Excel
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="card text-center">
          <p class="text-sm text-gray-500 dark:text-gray-400">Total Órdenes</p>
          <p class="text-3xl font-bold text-blue-600 dark:text-blue-400">{{ purchSummary.totalOrders || 0 }}</p>
        </div>
        <div class="card text-center">
          <p class="text-sm text-gray-500 dark:text-gray-400">Total Comprado</p>
          <p class="text-3xl font-bold text-orange-600 dark:text-orange-400">{{ formatCurrency(purchSummary.totalAmount) }}</p>
        </div>
        <div class="card text-center">
          <p class="text-sm text-gray-500 dark:text-gray-400">Top Proveedor</p>
          <p class="text-lg font-bold text-gray-900 dark:text-white truncate">{{ purchSummary.topSupplier || '—' }}</p>
        </div>
      </div>

      <div class="card">
        <h3 class="font-semibold mb-4 text-gray-900 dark:text-white">Compras por Día</h3>
        <div v-if="reportLoading" class="h-48 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
        <Bar v-else-if="purchChartData" :data="purchChartData" :options="barOptions" class="max-h-64" />
        <p v-else class="text-gray-400 text-center py-8">Sin datos para mostrar</p>
      </div>
    </div>

    <!-- Top Products -->
    <div v-else-if="activeTab === 'topProducts'" class="space-y-4">
      <div class="flex justify-end">
        <button class="btn-secondary flex items-center gap-2" :disabled="exportLoading" @click="exportReport('top-products')">
          <ArrowDownTrayIcon class="w-4 h-4" />
          Exportar Excel
        </button>
      </div>
      <div class="card">
        <h3 class="font-semibold mb-4 text-gray-900 dark:text-white">Productos Más Vendidos</h3>
        <div v-if="reportLoading" class="h-64 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
        <Bar
          v-else-if="topProductsChartData"
          :data="topProductsChartData"
          :options="horizontalBarOptions"
          class="max-h-96"
        />
        <p v-else class="text-gray-400 text-center py-8">Sin datos para mostrar</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reportsApi } from '@/services/api'
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { ArrowDownTrayIcon } from '@heroicons/vue/24/outline'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
} from 'chart.js'
import DataTable from '@/components/ui/DataTable.vue'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const toast = useToast()
const activeTab = ref('inventory')
const reportLoading = ref(false)
const exportLoading = ref(false)

const tabs = [
  { key: 'inventory', label: 'Inventario' },
  { key: 'sales', label: 'Ventas' },
  { key: 'purchases', label: 'Compras' },
  { key: 'topProducts', label: 'Top Productos' },
]

// Inventory
const inventoryReport = ref([])
const invPagination = reactive({ page: 1, limit: 25, total: 0 })
const inventoryCols = [
  { key: 'code', label: 'Código' },
  { key: 'name', label: 'Producto' },
  { key: 'currentStock', label: 'Stock Actual' },
  { key: 'totalValue', label: 'Valor Total' },
  { key: 'status', label: 'Estado' },
]

// Sales
const salesFilters = reactive({ dateFrom: '', dateTo: '' })
const salesSummary = ref({})
const salesChartData = ref(null)

// Purchases
const purchFilters = reactive({ dateFrom: '', dateTo: '' })
const purchSummary = ref({})
const purchChartData = ref(null)

// Top Products
const topProductsChartData = ref(null)

const barOptions = {
  responsive: true,
  plugins: { legend: { display: false } },
  scales: { y: { beginAtZero: true } },
}

const horizontalBarOptions = {
  indexAxis: 'y',
  responsive: true,
  plugins: { legend: { display: false } },
  scales: { x: { beginAtZero: true } },
}

function stockStatus(row) {
  const s = row.currentStock ?? row.stock ?? 0
  if (s === 0) return { badge: 'badge-red', label: 'Sin Stock' }
  if (s <= (row.minStock ?? 0)) return { badge: 'badge-amber', label: 'Stock Bajo' }
  return { badge: 'badge-green', label: 'Normal' }
}

function formatCurrency(v) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v || 0)
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

async function exportReport(type) {
  exportLoading.value = true
  try {
    const params = type === 'sales' ? salesFilters : type === 'purchases' ? purchFilters : {}
    await reportsApi.export(type, params)
    toast.success('Exportación iniciada')
  } catch (err) {
    toast.error('Error al exportar')
  } finally {
    exportLoading.value = false
  }
}

async function fetchInventoryReport() {
  reportLoading.value = true
  try {
    const res = await reportsApi.inventory({ page: invPagination.page, limit: invPagination.limit })
    inventoryReport.value = res.data.products || res.data.data || res.data.items || (Array.isArray(res.data) ? res.data : [])
    if ((res.data.meta?.total ?? res.data.total) !== undefined) invPagination.total = res.data.total
  } catch (err) {
    toast.error('Error al cargar reporte de inventario')
  } finally {
    reportLoading.value = false
  }
}

async function fetchSalesReport() {
  reportLoading.value = true
  try {
    const params = { from: salesFilters.dateFrom || undefined, to: salesFilters.dateTo || undefined }
    const res = await reportsApi.sales(params)
    salesSummary.value = {
      ...res.data.summary,
      topCustomer: res.data.byCustomer?.[0]?.name ?? '—',
    }
    // Build daily totals from orders array
    const dailyMap = {}
    for (const order of res.data.orders || []) {
      const day = order.saleDate?.substring(0, 10) ?? order.createdAt?.substring(0, 10)
      if (day) dailyMap[day] = (dailyMap[day] ?? 0) + Number(order.total)
    }
    const days = Object.keys(dailyMap).sort()
    salesChartData.value = days.length ? {
      labels: days,
      datasets: [{ label: 'Ventas', data: days.map(d => dailyMap[d]),
        backgroundColor: 'rgba(59,130,246,0.6)', borderColor: 'rgb(59,130,246)', borderWidth: 1 }],
    } : null
  } catch (err) {
    toast.error('Error al cargar reporte de ventas')
  } finally {
    reportLoading.value = false
  }
}

async function fetchPurchasesReport() {
  reportLoading.value = true
  try {
    const params = { from: purchFilters.dateFrom || undefined, to: purchFilters.dateTo || undefined }
    const res = await reportsApi.purchases(params)
    purchSummary.value = {
      ...res.data.summary,
      totalAmount: res.data.summary?.totalSpend ?? 0,
      topSupplier: res.data.bySupplier?.[0]?.name ?? '—',
    }
    // Build daily totals from orders array
    const dailyMap = {}
    for (const order of res.data.orders || []) {
      const day = order.orderDate?.substring(0, 10) ?? order.createdAt?.substring(0, 10)
      if (day) dailyMap[day] = (dailyMap[day] ?? 0) + Number(order.total)
    }
    const days = Object.keys(dailyMap).sort()
    purchChartData.value = days.length ? {
      labels: days,
      datasets: [{
        label: 'Compras',
        data: days.map(d => dailyMap[d]),
        backgroundColor: 'rgba(249, 115, 22, 0.6)',
        borderColor: 'rgb(249, 115, 22)',
        borderWidth: 1,
      }],
    } : null
  } catch (err) {
    toast.error('Error al cargar reporte de compras')
  } finally {
    reportLoading.value = false
  }
}

async function fetchTopProducts() {
  reportLoading.value = true
  try {
    const res = await reportsApi.topProducts()
    const items = res.data || []
    topProductsChartData.value = items.length ? {
      labels: items.map(i => i.product?.name ?? i.name ?? ''),
      datasets: [{
        label: 'Unidades Vendidas',
        data: items.map(i => i.totalQuantity ?? i.totalSold ?? 0),
        backgroundColor: 'rgba(16, 185, 129, 0.6)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
      }],
    } : null
  } catch (err) {
    toast.error('Error al cargar top productos')
  } finally {
    reportLoading.value = false
  }
}

watch(activeTab, (tab) => {
  if (tab === 'inventory') fetchInventoryReport()
  else if (tab === 'sales') fetchSalesReport()
  else if (tab === 'purchases') fetchPurchasesReport()
  else if (tab === 'topProducts') fetchTopProducts()
})

onMounted(fetchInventoryReport)
</script>
