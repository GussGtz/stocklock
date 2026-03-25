<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="page-header">
      <div class="flex items-center gap-3">
        <h1 class="page-title">Centro de Alertas</h1>
        <span v-if="unreadCount > 0" class="badge-red px-2 py-0.5 text-sm font-bold">
          {{ unreadCount }}
        </span>
      </div>
      <button
        v-if="unreadCount > 0"
        class="btn-secondary text-sm"
        :disabled="markingAll"
        @click="markAllRead"
      >
        {{ markingAll ? 'Marcando...' : 'Marcar todas como leídas' }}
      </button>
    </div>

    <!-- Filter Tabs -->
    <div class="border-b border-gray-200 dark:border-gray-700">
      <nav class="-mb-px flex gap-4">
        <button
          v-for="tab in filterTabs"
          :key="tab.key"
          class="py-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5"
          :class="activeFilter === tab.key
            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
          @click="activeFilter = tab.key"
        >
          {{ tab.label }}
          <span
            v-if="tab.count > 0"
            class="text-xs px-1.5 py-0.5 rounded-full font-bold"
            :class="activeFilter === tab.key ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'"
          >
            {{ tab.count }}
          </span>
        </button>
      </nav>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 5" :key="i" class="card flex gap-4 animate-pulse">
        <div class="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0"></div>
        <div class="flex-1 space-y-2">
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    </div>

    <!-- Alert List -->
    <div v-else-if="filteredAlerts.length > 0" class="space-y-3">
      <div
        v-for="alert in filteredAlerts"
        :key="alert.id"
        class="card transition-all"
        :class="!alert.isRead ? 'border-l-4 border-l-blue-500' : ''"
      >
        <div class="flex gap-4">
          <!-- Severity Icon -->
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            :class="severityBg(alert.severity)"
          >
            <XCircleIcon v-if="alert.severity === 'CRITICAL'" class="w-5 h-5 text-red-600" />
            <ExclamationTriangleIcon v-else-if="alert.severity === 'WARNING'" class="w-5 h-5 text-amber-600" />
            <InformationCircleIcon v-else class="w-5 h-5 text-blue-600" />
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="font-semibold text-gray-900 dark:text-white text-sm">{{ alert.title }}</p>
                <p class="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{{ alert.message }}</p>
                <div class="flex items-center gap-3 mt-1.5">
                  <span v-if="alert.productName" class="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    {{ alert.productName }}
                  </span>
                  <span class="text-xs text-gray-400">{{ timeAgo(alert.createdAt) }}</span>
                  <span :class="severityBadge(alert.severity)" class="text-xs">{{ severityLabel(alert.severity) }}</span>
                </div>
              </div>
              <div class="flex gap-1 flex-shrink-0">
                <button
                  v-if="!alert.isRead"
                  class="btn-ghost text-xs px-2 py-1 text-blue-600"
                  @click="markRead(alert)"
                >
                  <CheckIcon class="w-3.5 h-3.5" />
                </button>
                <button
                  class="btn-ghost text-xs px-2 py-1 text-red-500"
                  @click="dismiss(alert)"
                >
                  <XMarkIcon class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="card text-center py-16">
      <BellIcon class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
      <p class="text-gray-500">No hay alertas en esta categoría</p>
    </div>
  </div>
</template>

<script setup>
import { alertsApi } from '@/services/api'
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import {
  XCircleIcon, ExclamationTriangleIcon, InformationCircleIcon,
  CheckIcon, XMarkIcon, BellIcon,
} from '@heroicons/vue/24/outline'
import { useAlertsStore } from '@/stores/alerts'

const toast = useToast()
const alertsStore = useAlertsStore()

const loading = ref(false)
const markingAll = ref(false)
const alerts = ref([])
const activeFilter = ref('all')

const filterTabs = computed(() => [
  { key: 'all', label: 'Todas', count: alerts.value.length },
  { key: 'unread', label: 'No leídas', count: alerts.value.filter(a => !a.isRead).length },
  { key: 'LOW_STOCK', label: 'Stock Bajo', count: alerts.value.filter(a => a.type === 'LOW_STOCK').length },
  { key: 'OVER_STOCK', label: 'Exceso Stock', count: alerts.value.filter(a => a.type === 'OVER_STOCK').length },
  { key: 'NO_MOVEMENT', label: 'Sin Movimiento', count: alerts.value.filter(a => a.type === 'NO_MOVEMENT').length },
])

const unreadCount = computed(() => alerts.value.filter(a => !a.isRead).length)

const filteredAlerts = computed(() => {
  if (activeFilter.value === 'all') return alerts.value
  if (activeFilter.value === 'unread') return alerts.value.filter(a => !a.isRead)
  return alerts.value.filter(a => a.type === activeFilter.value)
})

function severityBg(s) {
  const m = { CRITICAL: 'bg-red-100 dark:bg-red-900/30', WARNING: 'bg-amber-100 dark:bg-amber-900/30', INFO: 'bg-blue-100 dark:bg-blue-900/30' }
  return m[s] || 'bg-gray-100 dark:bg-gray-800'
}

function severityBadge(s) {
  const m = { CRITICAL: 'badge-red', WARNING: 'badge-amber', INFO: 'badge-blue' }
  return m[s] || 'badge-gray'
}

function severityLabel(s) {
  const m = { CRITICAL: 'Crítico', WARNING: 'Advertencia', INFO: 'Información' }
  return m[s] || s
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Ahora'
  if (mins < 60) return `hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  return `hace ${Math.floor(hrs / 24)}d`
}

// Normalize notification: flatten alert.* fields to top level
function normalizeNotif(n) {
  return {
    ...n,
    isRead: n.readAt !== null,
    type: n.alert?.type,
    severity: n.alert?.severity,
    title: n.alert?.title,
    message: n.alert?.message,
    product: n.alert?.product,
    productName: n.alert?.product?.name ?? null,
  }
}

async function markRead(alert) {
  try {
    await alertsApi.read(alert.id)        // PATCH /alerts/notifications/:id/read
    alert.isRead = true
    alert.readAt = new Date().toISOString()
    alertsStore.fetchAlerts()             // refresh store badge count
  } catch (err) {
    toast.error('Error al marcar como leída')
  }
}

async function dismiss(alert) {
  try {
    await alertsApi.dismiss(alert.alertId)  // DELETE /alerts/:alertId
    alerts.value = alerts.value.filter(a => a.id !== alert.id)
    alertsStore.fetchAlerts()
  } catch (err) {
    toast.error('Error al descartar alerta')
  }
}

async function markAllRead() {
  markingAll.value = true
  try {
    // Mark each unread notification individually
    const unread = alerts.value.filter(a => !a.isRead)
    await Promise.all(unread.map(a => alertsApi.read(a.id)))
    alerts.value.forEach(a => { a.isRead = true; a.readAt = new Date().toISOString() })
    alertsStore.fetchAlerts()
    toast.success('Todas las alertas marcadas como leídas')
  } catch (err) {
    toast.error('Error al marcar alertas')
  } finally {
    markingAll.value = false
  }
}

async function fetchAlerts() {
  loading.value = true
  try {
    const res = await alertsApi.list()
    const raw = Array.isArray(res.data) ? res.data : (res.data.notifications || res.data.data || [])
    alerts.value = raw.map(normalizeNotif)
  } catch (err) {
    toast.error('Error al cargar alertas')
  } finally {
    loading.value = false
  }
}

onMounted(fetchAlerts)
</script>
