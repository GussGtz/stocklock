<template>
  <header class="h-14 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700/80 flex items-center gap-3 px-4 flex-shrink-0">

    <!-- Logo -->
    <RouterLink to="/dashboard" class="flex items-center gap-2.5 flex-shrink-0 mr-1">
      <div class="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
        <img src="@/assets/logo.png" alt="StockLock" class="w-full h-full object-contain" />
      </div>
      <span class="font-bold text-slate-900 dark:text-white text-sm hidden sm:block tracking-tight">
        StockLock
      </span>
    </RouterLink>

    <!-- Separator -->
    <div class="w-px h-5 bg-gray-200 dark:bg-slate-700 hidden sm:block flex-shrink-0"></div>

    <!-- Breadcrumb -->
    <nav class="flex items-center gap-1.5 text-sm min-w-0 flex-1">
      <span
        v-if="sectionLabel"
        :class="['font-medium flex-shrink-0 hidden sm:block', sectionColor]"
      >
        {{ sectionLabel }}
      </span>
      <ChevronRightIcon
        v-if="sectionLabel && pageTitle"
        class="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 flex-shrink-0 hidden sm:block"
      />
      <span class="font-semibold text-slate-800 dark:text-gray-100 truncate">
        {{ pageTitle }}
      </span>
    </nav>

    <!-- ── Right actions ── -->
    <div class="flex items-center gap-0.5 flex-shrink-0">

      <!-- Search -->
      <div class="relative hidden md:block">
        <button
          @click="searchOpen = !searchOpen"
          class="btn-ghost btn-icon text-gray-500 dark:text-gray-400"
          title="Buscar"
        >
          <MagnifyingGlassIcon class="w-4.5 h-4.5" />
        </button>
        <Transition name="search-fade">
          <div
            v-if="searchOpen"
            class="absolute right-0 top-10 w-72 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-modal p-3 z-50"
          >
            <div class="flex items-center gap-2 bg-gray-50 dark:bg-slate-900/60 rounded-lg px-3 py-2">
              <MagnifyingGlassIcon class="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                ref="searchInput"
                v-model="searchQuery"
                type="text"
                placeholder="Buscar en el sistema..."
                class="bg-transparent text-sm text-slate-900 dark:text-gray-100 placeholder-gray-400 outline-none w-full"
                @keydown.escape="searchOpen = false"
              />
            </div>
            <p class="text-xs text-gray-400 mt-2 px-1">Presiona Esc para cerrar</p>
          </div>
        </Transition>
      </div>

      <!-- WebSocket indicator -->
      <div
        class="flex items-center gap-1.5 px-2"
        :title="wsConnected ? 'Tiempo real activo' : 'Sin conexión en tiempo real'"
      >
        <div :class="['w-1.5 h-1.5 rounded-full transition-colors', wsConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-300 dark:bg-gray-600']" />
        <span class="hidden xl:block text-xs text-gray-400 dark:text-gray-500 font-medium">
          {{ wsConnected ? 'En línea' : 'Desconectado' }}
        </span>
      </div>

      <!-- Dark mode toggle -->
      <button
        @click="uiStore.toggleDarkMode"
        class="btn-ghost btn-icon text-gray-500 dark:text-gray-400"
        :title="uiStore.darkMode ? 'Modo claro' : 'Modo oscuro'"
      >
        <SunIcon v-if="uiStore.darkMode" class="w-4.5 h-4.5" />
        <MoonIcon v-else class="w-4.5 h-4.5" />
      </button>

      <!-- Alerts bell -->
      <RouterLink to="/alerts" class="btn-ghost btn-icon relative text-gray-500 dark:text-gray-400">
        <BellIcon class="w-4.5 h-4.5" />
        <Transition name="bounce-in">
          <span
            v-if="alerts.unreadCount > 0"
            class="absolute top-1 right-1 min-w-[14px] h-3.5 px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none"
          >
            {{ alerts.unreadCount > 9 ? '9+' : alerts.unreadCount }}
          </span>
        </Transition>
      </RouterLink>

      <!-- Divider -->
      <div class="w-px h-5 bg-gray-200 dark:bg-slate-700 mx-1"></div>

      <!-- User menu -->
      <Menu as="div" class="relative">
        <MenuButton class="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
          <div class="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center ring-2 ring-primary-200/50 dark:ring-primary-800/50 flex-shrink-0">
            <span class="text-xs font-bold text-primary-700 dark:text-primary-300">{{ initials }}</span>
          </div>
          <div class="hidden md:block text-left">
            <div class="text-sm font-semibold text-slate-800 dark:text-gray-200 leading-none">{{ auth.user?.firstName }}</div>
            <div class="text-2xs text-gray-400 dark:text-gray-500 mt-0.5 font-medium">{{ roleLabel }}</div>
          </div>
          <ChevronDownIcon class="w-3.5 h-3.5 text-gray-400 hidden md:block" />
        </MenuButton>

        <Transition
          enter-active-class="transition ease-out duration-100"
          enter-from-class="opacity-0 scale-95 translate-y-1"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition ease-in duration-75"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-1"
        >
          <MenuItems class="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-modal py-1.5 z-50 focus:outline-none">
            <div class="px-4 py-2.5 border-b border-gray-100 dark:border-slate-700 mb-1">
              <div class="text-sm font-semibold text-slate-900 dark:text-white">{{ auth.fullName }}</div>
              <div class="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{{ auth.user?.email }}</div>
            </div>
            <MenuItem v-slot="{ active }">
              <RouterLink
                to="/settings"
                :class="['flex items-center gap-2.5 px-4 py-2 text-sm transition-colors', active ? 'bg-gray-50 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-700 dark:text-gray-300']"
              >
                <CogIcon class="w-4 h-4" />
                Configuración
              </RouterLink>
            </MenuItem>
            <div class="mx-3 my-1 border-t border-gray-100 dark:border-slate-700"></div>
            <MenuItem v-slot="{ active }">
              <button
                @click="handleLogout"
                :class="['flex items-center gap-2.5 px-4 py-2 text-sm w-full text-left transition-colors', active ? 'bg-red-50 dark:bg-red-900/20 text-red-600' : 'text-gray-600 dark:text-gray-400']"
              >
                <ArrowRightOnRectangleIcon class="w-4 h-4" />
                Cerrar sesión
              </button>
            </MenuItem>
          </MenuItems>
        </Transition>
      </Menu>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import {
  MagnifyingGlassIcon, BellIcon, SunIcon, MoonIcon,
  ChevronDownIcon, ChevronRightIcon, CogIcon, ArrowRightOnRectangleIcon,
} from '@heroicons/vue/24/outline'
import { useUiStore }    from '@/stores/ui'
import { useAuthStore }  from '@/stores/auth'
import { useAlertsStore } from '@/stores/alerts'
import { useWebSocket }  from '@/composables/useWebSocket'

const uiStore   = useUiStore()
const auth      = useAuthStore()
const alerts    = useAlertsStore()
const route     = useRoute()
const router    = useRouter()
const { connected: wsConnected } = useWebSocket()

const searchOpen  = ref(false)
const searchQuery = ref('')
const searchInput = ref<HTMLInputElement | null>(null)

watch(searchOpen, async (val) => {
  if (val) { await nextTick(); searchInput.value?.focus() }
})

const initials = computed(() => {
  const u = auth.user
  if (!u) return '?'
  return `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase()
})

const roleLabel = computed(() => {
  const roles: Record<string, string> = {
    ADMIN: 'Administrador', MANAGER: 'Gerente',
    WAREHOUSE: 'Almacén', SALES: 'Ventas', VIEWER: 'Visualizador',
  }
  return roles[auth.user?.role ?? ''] ?? auth.user?.role ?? ''
})

// Section context for breadcrumb
const sectionMeta: Record<string, { label: string; color: string }> = {
  general:     { label: 'General',     color: 'text-blue-600 dark:text-blue-400'   },
  inventario:  { label: 'Inventario',  color: 'text-emerald-600 dark:text-emerald-400' },
  operaciones: { label: 'Operaciones', color: 'text-orange-600 dark:text-orange-400'   },
  analisis:    { label: 'Análisis',    color: 'text-violet-600 dark:text-violet-400'   },
  sistema:     { label: 'Sistema',     color: 'text-slate-600 dark:text-slate-400'     },
}

const currentSection = computed(() => route.meta.section as string | undefined)
const isHubPage      = computed(() => route.name?.toString().startsWith('hub-'))

const sectionLabel = computed(() => {
  const s = currentSection.value
  return s ? sectionMeta[s]?.label ?? '' : ''
})
const sectionColor = computed(() => {
  const s = currentSection.value
  return s ? sectionMeta[s]?.color ?? '' : ''
})
const pageTitle = computed(() => {
  if (isHubPage.value) return ''
  return (route.meta.title as string) || ''
})

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.search-fade-enter-active, .search-fade-leave-active { transition: all 0.15s ease; }
.search-fade-enter-from, .search-fade-leave-to { opacity: 0; transform: translateY(-6px) scale(0.98); }
.bounce-in-enter-active { transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); }
.bounce-in-enter-from   { opacity: 0; transform: scale(0.5); }
.bounce-in-leave-active { transition: all 0.1s ease; }
.bounce-in-leave-to     { opacity: 0; transform: scale(0); }
</style>
