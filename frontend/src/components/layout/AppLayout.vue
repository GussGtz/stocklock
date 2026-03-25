<template>
  <div class="flex h-screen overflow-hidden bg-gray-50 dark:bg-slate-950">

    <!-- ── Mobile overlay ── -->
    <Transition name="overlay-fade">
      <div
        v-if="uiStore.sidebarOpen && isMobile"
        class="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 lg:hidden"
        @click="uiStore.closeSidebar"
      />
    </Transition>

    <!-- ── Sidebar ── -->
    <div
      :class="[
        'fixed lg:relative inset-y-0 left-0 z-30 h-full transition-transform duration-300 ease-in-out',
        uiStore.sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      ]"
    >
      <AppSidebar />
    </div>

    <!-- ── Main area ── -->
    <div class="flex-1 flex flex-col overflow-hidden min-w-0">
      <!-- Topbar -->
      <AppHeader />

      <!-- Page content -->
      <main class="flex-1 overflow-y-auto">
        <div class="p-5 lg:p-6 space-y-6 animate-fade-in">
          <RouterView />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { RouterView } from 'vue-router'
import AppSidebar from './AppSidebar.vue'
import AppHeader  from './AppHeader.vue'
import { useUiStore } from '@/stores/ui'
import { useAlertsStore } from '@/stores/alerts'
import { useInventoryStore } from '@/stores/inventory'

const uiStore   = useUiStore()
const alerts    = useAlertsStore()
const inventory = useInventoryStore()
const isMobile  = ref(false)

function checkMobile() {
  isMobile.value = window.innerWidth < 1024
  if (!isMobile.value) uiStore.openSidebar()
}

onMounted(async () => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  await Promise.all([alerts.fetchAlerts(), inventory.fetchSummary()])
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
.overlay-fade-enter-active, .overlay-fade-leave-active { transition: opacity 0.25s ease; }
.overlay-fade-enter-from, .overlay-fade-leave-to { opacity: 0; }
</style>
