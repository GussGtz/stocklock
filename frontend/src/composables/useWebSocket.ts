import { ref, onUnmounted } from 'vue'
import { io, Socket } from 'socket.io-client'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'
import { useInventoryStore } from '@/stores/inventory'
import { useAlertsStore } from '@/stores/alerts'

let socket: Socket | null = null

export function useWebSocket() {
  const toast = useToast()
  const connected = ref(false)

  function connect() {
    const auth = useAuthStore()
    if (!auth.token || socket?.connected) return

    socket = io('/stock', {
      auth: { token: auth.token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 2000,
    })

    socket.on('connect', () => {
      connected.value = true
    })

    socket.on('disconnect', () => {
      connected.value = false
    })

    socket.on('inventory:movement', (data: any) => {
      const inventory = useInventoryStore()
      inventory.addRealtimeMovement(data)
    })

    socket.on('alert:new', (data: any) => {
      const alerts = useAlertsStore()
      alerts.addAlert(data)
      toast.warning(`⚠️ ${data.title}`, { timeout: 6000 })
    })

    socket.on('sale:confirmed', (data: any) => {
      toast.info(`Venta ${data.folio} confirmada`, { timeout: 4000 })
    })
  }

  function disconnect() {
    socket?.disconnect()
    socket = null
    connected.value = false
  }

  function joinWarehouse(warehouseId: string) {
    socket?.emit('join-warehouse', warehouseId)
  }

  onUnmounted(() => {
    // Keep socket alive — disconnect only on logout
  })

  return { connected, connect, disconnect, joinWarehouse }
}
