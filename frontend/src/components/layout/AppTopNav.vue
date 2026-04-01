<template>
  <div class="bg-white dark:bg-slate-900 border-b border-[#E8EDF2] dark:border-slate-700/80 flex-shrink-0">
    <nav class="flex items-center gap-0 px-3 sm:px-5 overflow-x-auto scrollbar-hide">
      <button
        v-for="sec in sections"
        :key="sec.id"
        @click="navigate(sec)"
        :class="[
          'relative flex items-center gap-2 px-4 h-10 text-[13px] font-semibold whitespace-nowrap flex-shrink-0 transition-colors duration-150 outline-none rounded-none',
          activeSection === sec.id
            ? sec.activeText
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-[#F4F7FA] dark:hover:bg-slate-800/60',
        ]"
      >
        <component :is="sec.icon" class="w-[15px] h-[15px] flex-shrink-0" />
        <span>{{ sec.label }}</span>

        <!-- Alert badge -->
        <span v-if="sec.id === 'general' && alertsStore.unreadCount > 0"
          class="min-w-[17px] h-[17px] px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
          {{ alertsStore.unreadCount > 9 ? '9+' : alertsStore.unreadCount }}
        </span>

        <!-- Active underline -->
        <span v-if="activeSection === sec.id"
          :class="['absolute bottom-0 left-0 right-0 h-[2.5px] rounded-t-full', sec.underline]" />
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore }   from '@/stores/auth'
import { useAlertsStore } from '@/stores/alerts'
import {
  HomeIcon, ArchiveBoxIcon, ShoppingCartIcon, ChartBarIcon, CogIcon,
} from '@heroicons/vue/24/outline'

const route        = useRoute()
const router       = useRouter()
const auth         = useAuthStore()
const alertsStore  = useAlertsStore()

const activeSection = computed(() => (route.meta.section as string) ?? 'general')

const sections = computed(() => [
  {
    id: 'general',
    label: 'General',
    hub: '/general',
    icon: HomeIcon,
    activeText: 'text-sky-500 dark:text-sky-400',
    underline: 'bg-sky-500',
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
    activeText: 'text-orange-500 dark:text-orange-400',
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
