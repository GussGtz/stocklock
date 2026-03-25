import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { alertsApi } from '@/services/api'

export const useAlertsStore = defineStore('alerts', () => {
  const alerts = ref<any[]>([])
  const loading = ref(false)

  const unreadCount = computed(() =>
    alerts.value.filter((a) => !a.readAt).length,
  )

  async function fetchAlerts() {
    loading.value = true
    try {
      const { data } = await alertsApi.list()
      alerts.value = Array.isArray(data) ? data : (data.notifications || data.data || [])
    } finally {
      loading.value = false
    }
  }

  async function markAsRead(notificationId: string) {
    await alertsApi.read(notificationId)
    const alert = alerts.value.find((a) => a.id === notificationId)
    if (alert) alert.readAt = new Date().toISOString()
  }

  async function dismissAlert(alertId: string) {
    await alertsApi.dismiss(alertId)
    alerts.value = alerts.value.filter((a) => a.alertId !== alertId)
  }

  function addAlert(alert: any) {
    alerts.value.unshift(alert)
  }

  return { alerts, loading, unreadCount, fetchAlerts, markAsRead, dismissAlert, addAlert }
})
