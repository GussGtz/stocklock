<template>
  <aside
    :class="[
      'flex flex-col flex-shrink-0 h-full',
      'bg-white dark:bg-slate-900',
      'border-r border-gray-200 dark:border-slate-700/80',
      'transition-all duration-300 ease-in-out z-30 overflow-hidden',
      uiStore.sidebarCollapsed ? 'w-[68px]' : 'w-60',
    ]"
  >
    <!-- ── Logo / Brand ── -->
    <div
      :class="[
        'flex items-center flex-shrink-0 border-b border-gray-200 dark:border-slate-700/80 transition-all duration-300',
        uiStore.sidebarCollapsed ? 'justify-center px-2 h-[72px]' : 'gap-3 px-4 h-[88px]',
      ]"
    >
      <!-- Logo grande -->
      <div :class="['flex-shrink-0 overflow-hidden rounded-xl', uiStore.sidebarCollapsed ? 'w-10 h-10' : 'w-[72px] h-[72px]']">
        <img src="@/assets/logo.png" alt="StockLock" class="w-full h-full object-contain" />
      </div>
      <Transition name="fade">
        <div v-if="!uiStore.sidebarCollapsed" class="overflow-hidden whitespace-nowrap">
          <div class="font-bold text-slate-900 dark:text-white text-base leading-none tracking-tight">StockLock</div>
        </div>
      </Transition>
    </div>

    <!-- ── Navigation ── -->
    <nav class="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-hide">
      <template v-for="section in navSections" :key="section.label">
        <!-- Section label -->
        <div
          v-if="!uiStore.sidebarCollapsed"
          class="section-label mt-3 first:mt-0"
        >
          {{ section.label }}
        </div>
        <div v-else class="my-2 mx-3 border-t border-gray-200 dark:border-slate-700/60"></div>

        <!-- Nav items -->
        <RouterLink
          v-for="item in section.items"
          :key="item.to"
          :to="item.to"
          custom
          v-slot="{ isActive, navigate }"
        >
          <button
            @click="navigate"
            :class="isActive ? 'nav-item-active' : 'nav-item-inactive'"
            :title="uiStore.sidebarCollapsed ? item.label : undefined"
            class="w-full relative group"
          >
            <!-- Icon -->
            <component :is="item.icon" class="w-[18px] h-[18px] flex-shrink-0" />

            <!-- Label -->
            <Transition name="fade">
              <span v-if="!uiStore.sidebarCollapsed" class="flex-1 truncate text-[13px]">
                {{ item.label }}
              </span>
            </Transition>

            <!-- Badge -->
            <Transition name="fade">
              <span
                v-if="item.badge && !uiStore.sidebarCollapsed"
                class="ml-auto min-w-[20px] h-5 px-1.5 flex items-center justify-center
                       bg-red-500 text-white text-[10px] font-bold rounded-full"
              >
                {{ item.badge > 99 ? '99+' : item.badge }}
              </span>
            </Transition>

            <!-- Collapsed badge dot -->
            <span
              v-if="item.badge && uiStore.sidebarCollapsed"
              class="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"
            />

            <!-- Tooltip when collapsed -->
            <div
              v-if="uiStore.sidebarCollapsed"
              class="pointer-events-none absolute left-full ml-2.5 top-1/2 -translate-y-1/2
                     bg-slate-800 dark:bg-slate-700 text-white text-xs font-medium
                     rounded-md px-2.5 py-1.5 whitespace-nowrap shadow-lg
                     opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50"
            >
              {{ item.label }}
              <div class="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800 dark:border-r-slate-700"></div>
            </div>
          </button>
        </RouterLink>
      </template>
    </nav>

    <!-- ── User footer ── -->
    <div class="border-t border-gray-200 dark:border-slate-700/80 p-3 flex-shrink-0">
      <div class="flex items-center gap-3 min-w-0">
        <!-- Avatar -->
        <div class="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0 ring-2 ring-primary-200 dark:ring-primary-800">
          <span class="text-xs font-bold text-primary-700 dark:text-primary-300">
            {{ initials }}
          </span>
        </div>

        <Transition name="fade">
          <div v-if="!uiStore.sidebarCollapsed" class="flex-1 min-w-0">
            <div class="text-sm font-semibold text-slate-900 dark:text-white truncate leading-none">
              {{ auth.fullName }}
            </div>
            <div class="text-2xs text-gray-400 dark:text-gray-500 truncate mt-0.5 font-medium uppercase tracking-wider">
              {{ roleLabel }}
            </div>
          </div>
        </Transition>

        <Transition name="fade">
          <button
            v-if="!uiStore.sidebarCollapsed"
            @click="handleLogout"
            class="btn-ghost btn-icon flex-shrink-0 text-gray-400 hover:text-red-500 dark:hover:text-red-400"
            title="Cerrar sesión"
          >
            <ArrowRightOnRectangleIcon class="w-4 h-4" />
          </button>
        </Transition>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { useAlertsStore } from '@/stores/alerts'
import {
  HomeIcon, CubeIcon, ShoppingCartIcon, CurrencyDollarIcon,
  WrenchScrewdriverIcon, ChartBarIcon, BellIcon, UsersIcon,
  CogIcon, BuildingStorefrontIcon, TruckIcon, ClipboardDocumentListIcon,
  ArrowsRightLeftIcon, ArchiveBoxIcon, ArrowRightOnRectangleIcon,
  SwatchIcon, BeakerIcon,
} from '@heroicons/vue/24/outline'

const uiStore  = useUiStore()
const auth     = useAuthStore()
const alerts   = useAlertsStore()
const router   = useRouter()

const initials = computed(() => {
  const u = auth.user
  if (!u) return '?'
  return `${(u.firstName?.[0] ?? '')}${(u.lastName?.[0] ?? '')}`.toUpperCase()
})

const roleLabel = computed(() => {
  const roles: Record<string, string> = {
    ADMIN:     'Administrador',
    MANAGER:   'Gerente',
    WAREHOUSE: 'Almacén',
    SALES:     'Ventas',
    VIEWER:    'Visualizador',
  }
  return roles[auth.user?.role ?? ''] ?? auth.user?.role ?? ''
})

function handleLogout() {
  auth.logout()
  router.push('/login')
}

const navSections = computed(() => [
  {
    label: 'General',
    items: [
      { to: '/dashboard', label: 'Dashboard',   icon: HomeIcon },
      { to: '/alerts',    label: 'Alertas',     icon: BellIcon, badge: alerts.unreadCount || 0 },
    ],
  },
  {
    label: 'Inventario',
    items: [
      { to: '/inventory',             label: 'Stock Actual',  icon: ArchiveBoxIcon },
      { to: '/inventory/movements',   label: 'Movimientos',   icon: ArrowsRightLeftIcon },
      { to: '/inventory/warehouses',  label: 'Almacenes',     icon: BuildingStorefrontIcon },
      { to: '/products',              label: 'Productos',     icon: CubeIcon },
      { to: '/products/categories',   label: 'Categorías',    icon: ClipboardDocumentListIcon },
      { to: '/sectors',               label: 'Sectores',      icon: SwatchIcon },
      { to: '/series',                label: 'Series de Aleación', icon: BeakerIcon },
    ],
  },
  {
    label: 'Operaciones',
    items: [
      { to: '/purchases',  label: 'Compras',     icon: ShoppingCartIcon },
      { to: '/suppliers',  label: 'Proveedores', icon: TruckIcon },
      { to: '/sales',      label: 'Ventas',      icon: CurrencyDollarIcon },
      { to: '/customers',  label: 'Clientes',    icon: UsersIcon },
      { to: '/production', label: 'Producción',  icon: WrenchScrewdriverIcon },
    ],
  },
  {
    label: 'Análisis',
    items: [
      { to: '/reports', label: 'Reportes', icon: ChartBarIcon },
    ],
  },
  {
    label: 'Sistema',
    items: [
      ...(auth.isAdmin ? [{ to: '/users', label: 'Usuarios', icon: UsersIcon }] : []),
      { to: '/settings', label: 'Configuración', icon: CogIcon },
    ],
  },
])
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from,
.fade-leave-to     { opacity: 0; }
</style>
