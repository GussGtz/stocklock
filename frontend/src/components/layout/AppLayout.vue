<template>
  <div class="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-slate-950">
    <!-- Top header (logo + actions) -->
    <AppHeader />
    <!-- Horizontal section nav -->
    <AppTopNav />
    <!-- Page content -->
    <main class="flex-1 overflow-y-auto">
      <div class="p-5 lg:p-6 space-y-6 animate-fade-in">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { RouterView } from 'vue-router'
import AppHeader  from './AppHeader.vue'
import AppTopNav  from './AppTopNav.vue'
import { useAlertsStore }    from '@/stores/alerts'
import { useInventoryStore } from '@/stores/inventory'
import { useKeepAlive }      from '@/composables/useKeepAlive'

const alerts    = useAlertsStore()
const inventory = useInventoryStore()
const { start: startKeepAlive, stop: stopKeepAlive } = useKeepAlive()

onMounted(async () => {
  await Promise.all([alerts.fetchAlerts(), inventory.fetchSummary()])
  startKeepAlive()
})

onUnmounted(() => {
  stopKeepAlive()
})
</script>
