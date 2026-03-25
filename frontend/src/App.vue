<template>
  <RouterView />
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import { onMounted } from 'vue'
import { useUiStore } from '@/stores/ui'
import { useWebSocket } from '@/composables/useWebSocket'
import { useAuthStore } from '@/stores/auth'

const uiStore = useUiStore()
const auth = useAuthStore()
const { connect } = useWebSocket()

onMounted(() => {
  if (auth.isAuthenticated) connect()
})
</script>
