<template>
  <div class="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700/80 flex-shrink-0">
    <nav class="flex items-center gap-0.5 px-3 sm:px-5 overflow-x-auto scrollbar-hide">
      <button
        v-for="sec in sections"
        :key="sec.id"
        @click="navigate(sec)"
        :class="[
          'relative flex items-center gap-2 px-3.5 sm:px-4 h-11 text-sm font-semibold whitespace-nowrap flex-shrink-0 transition-colors duration-150 outline-none',
          activeSection === sec.id
            ? sec.activeText
            : 'text-gray-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200',
        ]"
      >
        <component :is="sec.icon" class="w-4 h-4 flex-shrink-0" />
        <span>{{ sec.label }}</span>

        <!-- Alert badge on General -->
        <span
          v-if="sec.id === 'general' && alertsStore.unreadCount > 0"
          class="min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none"
        >
          {{ alertsStore.unreadCount > 9 ? '9+' : alertsStore.unreadCount }}
        </span>

        <!-- Active underline indicator -->
        <span
          v-if="activeSection === sec.id"
          :class="['absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full', sec.underline]"
        />
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAlertsStore } from '@/stores/alerts'
import {
  HomeIcon, ArchiveBoxIcon, ShoppingCartIcon, ChartBarIcon, CogIcon,
} from '@heroicons/vue/24/outline'

const route       = useRoute()
const router      = useRouter()
const auth        = useAuthStore()
const alertsStore = useAlertsStore()

// Which section is currently active based on route
const activeSection = computed(() => (route.meta.section as string) ?? 'general')

const sections = computed(() => [
  {
    id: 'general',
    label: 'General',
    hub: '/general',
    icon: HomeIcon,
    activeText: 'text-blue-600 dark:text-blue-400',
    underline: 'bg-blue-500',
  },
  {
    id: 'inventario',
    label: 'Inventario',
    hub: '/inventario',
    icon: ArchiveBoxIcon,
    activeText: 'text-emerald-600 dark:text-emerald-400',
    underline: 'bg-emerald-500',
  },
  {
    id: 'operaciones',
    label: 'Operaciones',
    hub: '/operaciones',
    icon: ShoppingCartIcon,
    activeText: 'text-orange-600 dark:text-orange-400',
    underline: 'bg-orange-500',
  },
  {
    id: 'analisis',
    label: 'Análisis',
    hub: '/analisis',
    icon: ChartBarIcon,
    activeText: 'text-violet-600 dark:text-violet-400',
    underline: 'bg-violet-500',
  },
  ...(auth.isAdmin || auth.user?.role === 'MANAGER' ? [{
    id: 'sistema',
    label: 'Sistema',
    hub: '/sistema',
    icon: CogIcon,
    activeText: 'text-slate-600 dark:text-slate-300',
    underline: 'bg-slate-500',
  }] : []),
])

function navigate(sec: typeof sections.value[0]) {
  router.push(sec.hub)
}
</script>
