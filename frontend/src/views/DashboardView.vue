<template>
  <div class="space-y-6">
    <!-- Welcome -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          Buenas {{ greeting }}, {{ auth.user?.firstName }} 👋
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {{ today }} — Aquí está el resumen de tu operación
        </p>
      </div>
      <button @click="refresh" class="btn-secondary">
        <ArrowPathIcon :class="['w-4 h-4', loading && 'animate-spin']" />
        Actualizar
      </button>
    </div>

    <!-- KPI Cards — 6 cards -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <StatCard v-for="stat in stats" :key="stat.label" v-bind="stat" :loading="loading" />
    </div>

    <!-- Row 1: Inventario por Categoría + Estado Stock -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <div class="card xl:col-span-2">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-base font-semibold text-slate-900 dark:text-white">Inventario por Categoría</h3>
          <span class="badge badge-blue text-xs">Unidades</span>
        </div>
        <div class="h-64">
          <Bar v-if="!loading && barData" :data="barData" :options="barOptions" />
          <div v-else class="skeleton h-full rounded-lg" />
        </div>
      </div>

      <div class="card">
        <h3 class="text-base font-semibold text-slate-900 dark:text-white mb-4">Estado del Stock</h3>
        <div class="h-48 flex items-center justify-center">
          <Doughnut v-if="!loading && donutData" :data="donutData" :options="donutOptions" />
          <div v-else class="skeleton w-40 h-40 rounded-full" />
        </div>
        <div class="space-y-2 mt-4">
          <div v-for="item in stockStatus" :key="item.label" class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-2">
              <div :class="['w-3 h-3 rounded-full', item.color]" />
              <span class="text-gray-600 dark:text-gray-400 text-xs">{{ item.label }}</span>
            </div>
            <span class="text-sm font-bold text-slate-900 dark:text-white">{{ item.value }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Row 2: Ventas por día + Top Productos -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <div class="card xl:col-span-2">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-base font-semibold text-slate-900 dark:text-white">Ventas del Mes por Día</h3>
          <span class="badge badge-green text-xs">{{ currentMonth }}</span>
        </div>
        <div class="h-64">
          <Line v-if="!loading && lineData" :data="lineData" :options="lineOptions" />
          <div v-else class="skeleton h-full rounded-lg" />
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-base font-semibold text-slate-900 dark:text-white">Top 5 Productos Vendidos</h3>
          <span class="badge badge-blue text-xs">Este mes</span>
        </div>
        <div class="h-64">
          <Bar v-if="!loading && topProductsData" :data="topProductsData" :options="horizontalBarOptions" />
          <div v-else-if="loading" class="skeleton h-full rounded-lg" />
          <div v-else class="flex flex-col items-center justify-center h-full text-gray-400 text-sm gap-2">
            <ChartBarIcon class="w-10 h-10 opacity-30" />
            Sin ventas este mes
          </div>
        </div>
      </div>
    </div>

    <!-- Row 3: Ventas vs Compras + Órdenes Pendientes -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <div class="card xl:col-span-2">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-base font-semibold text-slate-900 dark:text-white">Ventas vs Compras — Últimos 6 Meses</h3>
          <span class="badge badge-blue text-xs">Comparativa</span>
        </div>
        <div class="h-64">
          <Bar v-if="!loading && salesVsPurchasesData" :data="salesVsPurchasesData" :options="groupedBarOptions" />
          <div v-else class="skeleton h-full rounded-lg" />
        </div>
      </div>

      <!-- Órdenes pendientes -->
      <div class="card">
        <h3 class="text-base font-semibold text-slate-900 dark:text-white mb-5">Órdenes Pendientes</h3>
        <div v-if="loading" class="space-y-4">
          <div v-for="i in 3" :key="i" class="skeleton h-16 rounded-lg" />
        </div>
        <div v-else class="space-y-4">
          <RouterLink to="/sales" class="flex items-center gap-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
            <div class="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
              <ShoppingCartIcon class="w-5 h-5 text-white" />
            </div>
            <div class="flex-1">
              <p class="text-sm font-semibold text-slate-900 dark:text-white">Ventas Pendientes</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Draft + Confirmadas</p>
            </div>
            <span class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ dashboardData?.pendingSales ?? 0 }}</span>
          </RouterLink>

          <RouterLink to="/purchases" class="flex items-center gap-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors">
            <div class="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
              <TruckIcon class="w-5 h-5 text-white" />
            </div>
            <div class="flex-1">
              <p class="text-sm font-semibold text-slate-900 dark:text-white">Compras Pendientes</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Draft + Enviadas + Confirmadas</p>
            </div>
            <span class="text-2xl font-bold text-amber-600 dark:text-amber-400">{{ dashboardData?.pendingPurchases ?? 0 }}</span>
          </RouterLink>

          <RouterLink to="/inventory" class="flex items-center gap-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
            <div class="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center flex-shrink-0">
              <ExclamationTriangleIcon class="w-5 h-5 text-white" />
            </div>
            <div class="flex-1">
              <p class="text-sm font-semibold text-slate-900 dark:text-white">Stock Bajo</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Productos bajo mínimo</p>
            </div>
            <span class="text-2xl font-bold text-red-600 dark:text-red-400">{{ dashboardData?.lowStockCount ?? 0 }}</span>
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- Row 4: Stock Bajo + Movimientos Recientes -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            Stock Bajo
            <span class="badge badge-red">{{ lowStockItems.length }}</span>
          </h3>
          <RouterLink to="/inventory" class="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors">
            Ver todo →
          </RouterLink>
        </div>
        <div v-if="loading" class="space-y-3">
          <div v-for="i in 4" :key="i" class="skeleton h-12 rounded-lg" />
        </div>
        <div v-else-if="lowStockItems.length === 0" class="text-center py-8 text-gray-400 text-sm">
          ✅ Todo el inventario está en niveles óptimos
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="item in lowStockItems.slice(0, 5)"
            :key="item.id"
            class="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-600/10 rounded-lg border border-red-100 dark:border-red-600/20"
          >
            <ExclamationTriangleIcon class="w-4 h-4 text-red-500 flex-shrink-0" />
            <div class="flex-1 min-w-0">
              <div class="text-sm font-semibold text-slate-900 dark:text-white truncate">{{ item.name }}</div>
              <div class="text-xs text-gray-400">{{ item.code }}</div>
            </div>
            <div class="text-right flex-shrink-0">
              <div class="text-sm font-bold text-red-600">{{ item.currentStock }} {{ item.unit }}</div>
              <div class="text-xs text-gray-400">Mín: {{ item.minStock }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-base font-semibold text-slate-900 dark:text-white">Movimientos Recientes</h3>
          <RouterLink to="/inventory/movements" class="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors">
            Ver todo →
          </RouterLink>
        </div>
        <div v-if="loading" class="space-y-3">
          <div v-for="i in 5" :key="i" class="skeleton h-10 rounded-lg" />
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="mov in recentMovements"
            :key="mov.id"
            class="flex items-center gap-3 py-2.5 border-b border-gray-100 dark:border-slate-700/60 last:border-0"
          >
            <div :class="['w-2 h-2 rounded-full flex-shrink-0', movementColor(mov.type)]" />
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-slate-900 dark:text-white truncate">{{ mov.product?.name }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400">{{ movementLabel(mov.type) }} · {{ formatDate(mov.createdAt) }}</div>
            </div>
            <div :class="['text-sm font-semibold', mov.type === 'EXIT' ? 'text-red-500' : 'text-green-500']">
              {{ mov.type === 'EXIT' ? '-' : '+' }}{{ mov.quantity }}
            </div>
          </div>
          <div v-if="recentMovements.length === 0" class="text-center py-6 text-gray-400 text-sm">
            Sin movimientos recientes
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { Bar, Doughnut, Line } from 'vue-chartjs'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend, Title, LineElement, PointElement, Filler,
} from 'chart.js'
import {
  ArrowPathIcon, ExclamationTriangleIcon,
  ShoppingCartIcon, TruckIcon, ChartBarIcon,
} from '@heroicons/vue/24/outline'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import { useAuthStore } from '@/stores/auth'
import { reportsApi, productsApi, inventoryApi } from '@/services/api'
import StatCard from '@/components/ui/StatCard.vue'

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend, Title,
  LineElement, PointElement, Filler,
)
dayjs.locale('es')

const auth = useAuthStore()
const loading = ref(true)
const dashboardData = ref<any>(null)
const salesReport = ref<any>(null)
const lowStockItems = ref<any[]>([])
const recentMovements = ref<any[]>([])

const today = computed(() => dayjs().format('dddd, D [de] MMMM YYYY'))
const currentMonth = computed(() => dayjs().format('MMMM YYYY'))
const greeting = computed(() => {
  const h = dayjs().hour()
  if (h < 12) return 'días'
  if (h < 18) return 'tardes'
  return 'noches'
})

// ── KPI stats (6 cards) ──────────────────────────────────────────────────────
const stats = computed(() => {
  const d = dashboardData.value
  if (!d) return Array(6).fill({ label: '', value: '', icon: null, color: '' })
  return [
    {
      label: 'Total Productos',
      value: d.totalProducts ?? 0,
      change: d.productsChange,
      icon: 'cube',
      iconBg: 'bg-primary-100 dark:bg-primary-900/30',
      iconColor: 'text-primary-600 dark:text-primary-400',
    },
    {
      label: 'Valor Inventario',
      value: formatCurrency(d.totalInventoryValue ?? 0),
      icon: 'currency',
      iconBg: 'bg-green-50 dark:bg-green-600/20',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      label: 'Ventas del Mes',
      value: formatCurrency(d.salesThisMonth?.total ?? 0),
      subtitle: `${d.salesThisMonth?.count ?? 0} órdenes`,
      icon: 'chart',
      iconBg: 'bg-blue-50 dark:bg-blue-600/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Compras del Mes',
      value: formatCurrency(d.purchasesThisMonth?.total ?? 0),
      subtitle: `${d.purchasesThisMonth?.count ?? 0} órdenes`,
      icon: 'truck',
      iconBg: 'bg-amber-50 dark:bg-amber-600/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      label: 'Movimientos Hoy',
      value: d.movementsToday ?? 0,
      icon: 'arrows',
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      label: 'Alertas Activas',
      value: d.activeAlerts ?? d.lowStockCount ?? 0,
      icon: 'bell',
      iconBg: 'bg-amber-50 dark:bg-amber-600/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
  ]
})

// ── Chart 1: Inventario por Categoría (bar) ──────────────────────────────────
const barData = computed(() => {
  const d = dashboardData.value
  if (!d?.stockByCategory) return null
  return {
    labels: d.stockByCategory.map((c: any) => c.category),
    datasets: [{
      label: 'Unidades en Stock',
      data: d.stockByCategory.map((c: any) => c.quantity),
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 1,
      borderRadius: 6,
    }],
  }
})

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { grid: { color: 'rgba(148,163,184,0.1)' }, ticks: { color: '#94a3b8' } },
    x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
  },
}

// ── Chart 2: Estado del Stock (donut) ────────────────────────────────────────
const donutData = computed(() => {
  const d = dashboardData.value
  if (!d) return null
  return {
    labels: ['Normal', 'Stock Bajo', 'Sin Stock', 'Exceso'],
    datasets: [{
      data: [d.stockNormal ?? 0, d.stockLow ?? 0, d.stockZero ?? 0, d.stockOver ?? 0],
      backgroundColor: ['#22c55e', '#f59e0b', '#ef4444', '#3b82f6'],
      borderWidth: 0,
    }],
  }
})

const donutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '70%',
  plugins: { legend: { display: false } },
}

const stockStatus = computed(() => {
  const d = dashboardData.value
  if (!d) return []
  return [
    { label: 'Stock Normal', value: d.stockNormal ?? 0, color: 'bg-green-500' },
    { label: 'Stock Bajo', value: d.stockLow ?? 0, color: 'bg-amber-500' },
    { label: 'Sin Stock', value: d.stockZero ?? 0, color: 'bg-red-500' },
    { label: 'Exceso', value: d.stockOver ?? 0, color: 'bg-blue-500' },
  ]
})

// ── Chart 3: Ventas por día del mes (line) ───────────────────────────────────
const lineData = computed(() => {
  const orders = salesReport.value?.orders
  if (!orders) return null

  const daysInMonth = dayjs().daysInMonth()
  const labels = Array.from({ length: daysInMonth }, (_, i) =>
    String(i + 1).padStart(2, '0'),
  )
  const totals = new Array(daysInMonth).fill(0)

  for (const order of orders) {
    const day = dayjs(order.saleDate).date() - 1
    if (day >= 0 && day < daysInMonth) {
      totals[day] += Number(order.total)
    }
  }

  return {
    labels,
    datasets: [{
      label: 'Ventas ($)',
      data: totals,
      borderColor: 'rgba(34, 197, 94, 1)',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      borderWidth: 2,
      pointRadius: 3,
      pointBackgroundColor: 'rgba(34, 197, 94, 1)',
      fill: true,
      tension: 0.4,
    }],
  }
})

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: any) => ` $${Number(ctx.raw).toLocaleString('es-MX', { minimumFractionDigits: 0 })}`,
      },
    },
  },
  scales: {
    y: {
      grid: { color: 'rgba(148,163,184,0.1)' },
      ticks: {
        color: '#94a3b8',
        callback: (v: any) => `$${Number(v).toLocaleString('es-MX', { maximumFractionDigits: 0 })}`,
      },
    },
    x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
  },
}

// ── Chart 4: Top 5 Productos (horizontal bar) ────────────────────────────────
const topProductsData = computed(() => {
  const tp = dashboardData.value?.topProducts
  if (!tp || tp.length === 0) return null
  const top5 = tp.slice(0, 5)
  return {
    labels: top5.map((p: any) => {
      const name: string = p.product?.name ?? p.name ?? ''
      return name.length > 20 ? name.substring(0, 20) + '…' : name
    }),
    datasets: [{
      label: 'Ingresos ($)',
      data: top5.map((p: any) => Number(p.totalRevenue ?? p.revenue ?? 0)),
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(239, 68, 68, 0.8)',
      ],
      borderRadius: 4,
    }],
  }
})

const horizontalBarOptions = {
  indexAxis: 'y' as const,
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: any) => ` $${Number(ctx.raw).toLocaleString('es-MX', { minimumFractionDigits: 0 })}`,
      },
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(148,163,184,0.1)' },
      ticks: {
        color: '#94a3b8',
        callback: (v: any) => `$${Number(v / 1000).toFixed(0)}k`,
      },
    },
    y: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } },
  },
}

// ── Chart 5: Ventas vs Compras últimos 6 meses (grouped bar) ─────────────────
const salesVsPurchasesData = computed(() => {
  const d = dashboardData.value
  if (!d) return null

  // Build last 6 months labels
  const months = Array.from({ length: 6 }, (_, i) =>
    dayjs().subtract(5 - i, 'month').format('MMM YY'),
  )

  // We have totals for current month; pad previous months with 0 as placeholders
  // until a proper endpoint with monthly history is available
  const salesData = new Array(6).fill(0)
  const purchasesData = new Array(6).fill(0)
  salesData[5] = d.salesThisMonth?.total ?? 0
  purchasesData[5] = d.purchasesThisMonth?.total ?? 0

  return {
    labels: months,
    datasets: [
      {
        label: 'Ventas',
        data: salesData,
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderRadius: 4,
      },
      {
        label: 'Compras',
        data: purchasesData,
        backgroundColor: 'rgba(245, 158, 11, 0.8)',
        borderRadius: 4,
      },
    ],
  }
})

const groupedBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      labels: { color: '#94a3b8', boxWidth: 12, font: { size: 12 } },
    },
    tooltip: {
      callbacks: {
        label: (ctx: any) => ` ${ctx.dataset.label}: $${Number(ctx.raw).toLocaleString('es-MX', { minimumFractionDigits: 0 })}`,
      },
    },
  },
  scales: {
    y: {
      grid: { color: 'rgba(148,163,184,0.1)' },
      ticks: {
        color: '#94a3b8',
        callback: (v: any) => `$${Number(v / 1000).toFixed(0)}k`,
      },
    },
    x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
  },
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function movementColor(type: string) {
  const colors: Record<string, string> = {
    ENTRY: 'bg-green-500', EXIT: 'bg-red-500', ADJUSTMENT: 'bg-amber-500',
    TRANSFER: 'bg-blue-500', PRODUCTION_IN: 'bg-purple-500', PRODUCTION_OUT: 'bg-orange-500',
  }
  return colors[type] ?? 'bg-gray-400'
}

function movementLabel(type: string) {
  const labels: Record<string, string> = {
    ENTRY: 'Entrada', EXIT: 'Salida', ADJUSTMENT: 'Ajuste',
    TRANSFER: 'Transferencia', PRODUCTION_IN: 'Entrada Prod.', PRODUCTION_OUT: 'Salida Prod.',
  }
  return labels[type] ?? type
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN', maximumFractionDigits: 0,
  }).format(val ?? 0)
}

function formatDate(d: string) {
  return dayjs(d).fromNow()
}

// ── Data fetch ───────────────────────────────────────────────────────────────
async function refresh() {
  loading.value = true
  try {
    const monthStart = dayjs().startOf('month').format('YYYY-MM-DD')
    const today = dayjs().format('YYYY-MM-DD')

    const [dashRes, lowRes, movRes, salesRes] = await Promise.all([
      reportsApi.dashboard(),
      productsApi.lowStock(),
      inventoryApi.movements({ limit: 10 }),
      reportsApi.sales({ from: monthStart, to: today }),
    ])
    dashboardData.value = dashRes.data
    lowStockItems.value = lowRes.data
    recentMovements.value = movRes.data?.data ?? []
    salesReport.value = salesRes.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  import('dayjs/plugin/relativeTime').then(m => dayjs.extend(m.default))
  refresh()
})
</script>
