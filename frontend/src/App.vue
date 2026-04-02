<template>
  <RouterView />
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import { onMounted } from 'vue'
import { useUiStore } from '@/stores/ui'
import { useWebSocket } from '@/composables/useWebSocket'
import { useAuthStore } from '@/stores/auth'
import { useKeepAlive } from '@/composables/useKeepAlive'

const uiStore = useUiStore()
const auth = useAuthStore()
const { connect } = useWebSocket()
const { start: startKeepAlive } = useKeepAlive()

onMounted(() => {
  startKeepAlive()  // ping health endpoint immediately on app load (wakes Neon before login)
  if (auth.isAuthenticated) connect()
})
</script>
