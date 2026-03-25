<template>
  <div class="space-y-6">
    <!-- Welcome -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          Buenas {{ greeting }}, {{ auth.user?.firstName }} 👋
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {{ today }} — Aquí está el resumen de tu inventario
        </p>
      </div>
      <button @click="refresh" class="btn-secondary">
        <ArrowPathIcon :class="['w-4 h-4', loading && 'animate-spin']" />
        Actualizar
      </button>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard
        v-for="stat in stats"
        :key="stat.label"
        v-bind="stat"
        :loading="loading"
      />
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <!-- Stock by Category -->
      <div class="card xl:col-span-2">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-base font-semibold text-slate-900 dark:text-white">Inventario por Categoría</h3>
          <span class="badge badge-blue">{{ today }}</span>
        </div>
        <div class="h-64">
          <Bar v-if="!loading && barData" :data="barData" :options="barOptions" />
          <div v-else class="skeleton h-full rounded-lg" />
        </div>
      </div>

      <!-- Stock Status Donut -->
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

    <!-- Bottom Row -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <!-- Low Stock Alert -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            Stock Bajo
            <span class="badge badge-red">{{ lowStockItems.length }}</span>
          </h3>
          <RouterLink to="/inventory" class="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
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

      <!-- Recent Movements -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-base font-semibold text-slate-900 dark:text-white">Movimientos Recientes</h3>
          <RouterLink to="/inventory/movements" class="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
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
import { Bar, Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend, Title,
} from 'chart.js'
import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import { useAuthStore } from '@/stores/auth'
import { reportsApi, productsApi, inventoryApi } from '@/services/api'
import StatCard from '@/components/ui/StatCard.vue'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Title)
dayjs.locale('es')

const auth = useAuthStore()
const loading = ref(true)
const dashboardData = ref<any>(null)
const lowStockItems = ref<any[]>([])
const recentMovements = ref<any[]>([])

const today = computed(() => dayjs().format('dddd, D [de] MMMM YYYY'))
const greeting = computed(() => {
  const h = dayjs().hour()
  if (h < 12) return 'días'
  if (h < 18) return 'tardes'
  return 'noches'
})

const stats = computed(() => {
  const d = dashboardData.value
  if (!d) return Array(4).fill({ label: '', value: '', icon: null, color: '' })
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
      label: 'Valor del Inventario',
      value: formatCurrency(d.totalInventoryValue ?? d.totalValue ?? 0),
      change: d.valueChange,
      icon: 'currency',
      iconBg: 'bg-green-50 dark:bg-green-600/20',
      iconColor: 'text-green-600 dark:text-green-400',
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

function movementColor(type: string) {
  const colors: Record<string, string> = {
    ENTRY: 'bg-green-500',
    EXIT: 'bg-red-500',
    ADJUSTMENT: 'bg-amber-500',
    TRANSFER: 'bg-blue-500',
    PRODUCTION_IN: 'bg-purple-500',
    PRODUCTION_OUT: 'bg-orange-500',
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
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val ?? 0)
}

function formatDate(d: string) {
  return dayjs(d).fromNow()
}

async function refresh() {
  loading.value = true
  try {
    const [dashRes, lowRes, movRes] = await Promise.all([
      reportsApi.dashboard(),
      productsApi.lowStock(),
      inventoryApi.movements({ limit: 10 }),
    ])
    dashboardData.value = dashRes.data
    lowStockItems.value = lowRes.data
    recentMovements.value = movRes.data?.data ?? []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // Import dayjs plugin
  import('dayjs/plugin/relativeTime').then(m => dayjs.extend(m.default))
  refresh()
})
</script>
