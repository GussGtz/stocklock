import { defineStore } from 'pinia'
import { ref } from 'vue'
import { inventoryApi } from '@/services/api'

export const useInventoryStore = defineStore('inventory', () => {
  const movements = ref<any[]>([])
  const realtimeMovements = ref<any[]>([])
  const summary = ref<any>(null)
  const loading = ref(false)
  const pagination = ref({ page: 1, limit: 20, total: 0 })

  async function fetchMovements(params?: any) {
    loading.value = true
    try {
      const { data } = await inventoryApi.movements({ ...pagination.value, ...params })
      movements.value = data.data
      pagination.value.total = data.total
    } finally {
      loading.value = false
    }
  }

  async function fetchSummary() {
    const { data } = await inventoryApi.summary()
    summary.value = data
  }

  async function createMovement(payload: any) {
    const { data } = await inventoryApi.createMovement(payload)
    movements.value.unshift(data)
    return data
  }

  async function adjustStock(payload: any) {
    const { data } = await inventoryApi.adjust(payload)
    return data
  }

  async function transferStock(payload: any) {
    const { data } = await inventoryApi.transfer(payload)
    return data
  }

  function addRealtimeMovement(movement: any) {
    realtimeMovements.value.unshift(movement)
    if (realtimeMovements.value.length > 50) realtimeMovements.value.pop()
  }

  return {
    movements, realtimeMovements, summary, loading, pagination,
    fetchMovements, fetchSummary, createMovement, adjustStock, transferStock, addRealtimeMovement,
  }
})
