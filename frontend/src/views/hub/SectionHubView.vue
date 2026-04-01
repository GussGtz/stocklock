<template>
  <div class="space-y-7">
    <!-- Section header -->
    <div class="flex items-center gap-4">
      <div :class="['w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0', cfg.headerIconBg]">
        <component :is="cfg.icon" :class="['w-6 h-6', cfg.headerIconColor]" />
      </div>
      <div>
        <h1 class="text-2xl font-bold text-slate-800 dark:text-white leading-tight">{{ cfg.label }}</h1>
        <p class="text-sm text-slate-500 dark:text-gray-400 mt-0.5">{{ cfg.description }}</p>
      </div>
    </div>

    <!-- Cards grid -->
    <div :class="[
      'grid gap-5',
      visibleItems.length === 1 ? 'grid-cols-1 max-w-xs' :
      visibleItems.length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-xl' :
      visibleItems.length <= 4  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' :
      'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
    ]">
      <div
        v-for="item in visibleItems"
        :key="item.to"
        :class="['group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl', item.bg]"
        @click="router.push(item.to)"
      >
        <!-- Decorative circles -->
        <div class="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
        <div class="absolute -bottom-8 -right-4 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />

        <div class="relative p-6 flex flex-col gap-4 h-full min-h-[180px]">
          <!-- Icon -->
          <div class="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
            <component :is="item.icon" class="w-6 h-6 text-white" />
          </div>

          <!-- Text -->
          <div class="flex-1">
            <div class="flex items-start justify-between gap-2">
              <h3 class="font-bold text-white text-lg leading-snug">{{ item.label }}</h3>
              <span v-if="item.badge && item.badge > 0"
                class="flex-shrink-0 min-w-[22px] h-[22px] px-1.5 bg-white/30 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {{ item.badge > 99 ? '99+' : item.badge }}
              </span>
            </div>
            <p class="text-sm text-white/75 mt-1.5 leading-snug">{{ item.description }}</p>
          </div>

          <!-- Action row -->
          <div class="flex items-center gap-2 pt-2 border-t border-white/20">
            <button
              @click.stop="router.push(item.to)"
              class="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition-colors"
            >
              {{ item.actionLabel ?? 'Abrir' }}
              <ArrowRightIcon class="w-3 h-3" />
            </button>
            <button
              v-if="item.createTo"
              @click.stop="router.push(item.createTo)"
              class="flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition-colors"
            >
              <PlusIcon class="w-3.5 h-3.5" />
              Nuevo
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore }   from '@/stores/auth'
import { useAlertsStore } from '@/stores/alerts'
import {
  HomeIcon, BellIcon, ArchiveBoxIcon, ArrowsRightLeftIcon,
  BuildingStorefrontIcon, CubeIcon, ClipboardDocumentListIcon,
  SwatchIcon, BeakerIcon, ShoppingCartIcon, TruckIcon,
  CurrencyDollarIcon, UsersIcon, WrenchScrewdriverIcon,
  ChartBarIcon, CogIcon, ArrowRightIcon, PlusIcon,
} from '@heroicons/vue/24/outline'

const route  = useRoute()
const router = useRouter()
const auth   = useAuthStore()
const alertsStore = useAlertsStore()

interface CardItem {
  icon: any
  label: string
  description: string
  to: string
  createTo?: string
  actionLabel?: string
  bg: string           // solid gradient bg class
  badge?: number
  roles?: string[]
}

interface SectionConfig {
  label: string
  description: string
  icon: any
  headerIconBg: string
  headerIconColor: string
  items: CardItem[]
}

const allSections: Record<string, SectionConfig> = {
  general: {
    label: 'General',
    description: 'Panel principal y notificaciones del sistema',
    icon: HomeIcon,
    headerIconBg: 'bg-sky-100 dark:bg-sky-900/30',
    headerIconColor: 'text-sky-600 dark:text-sky-400',
    items: [
      {
        icon: HomeIcon,
        label: 'Dashboard',
        description: 'Resumen general con KPIs y gráficas en tiempo real',
        to: '/dashboard',
        actionLabel: 'Ver Dashboard',
        bg: 'bg-gradient-to-br from-sky-500 to-sky-600',
      },
      {
        icon: BellIcon,
        label: 'Alertas',
        description: 'Notificaciones de stock bajo y avisos importantes',
        to: '/alerts',
        actionLabel: 'Ver Alertas',
        bg: 'bg-gradient-to-br from-orange-400 to-orange-500',
        get badge() { return alertsStore.unreadCount },
      },
    ],
  },

  inventario: {
    label: 'Inventario',
    description: 'Gestión completa de productos, stock, movimientos y almacenes',
    icon: ArchiveBoxIcon,
    headerIconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    headerIconColor: 'text-emerald-600 dark:text-emerald-400',
    items: [
      {
        icon: ArchiveBoxIcon,
        label: 'Stock Actual',
        description: 'Inventario disponible por producto y almacén',
        to: '/inventory',
        actionLabel: 'Ver Stock',
        bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      },
      {
        icon: ArrowsRightLeftIcon,
        label: 'Movimientos',
        description: 'Historial de entradas, salidas y transferencias',
        to: '/inventory/movements',
        actionLabel: 'Ver Historial',
        bg: 'bg-gradient-to-br from-teal-500 to-teal-600',
      },
      {
        icon: BuildingStorefrontIcon,
        label: 'Almacenes',
        description: 'Gestión de ubicaciones físicas y capacidades',
        to: '/inventory/warehouses',
        actionLabel: 'Administrar',
        createTo: '/inventory/warehouses?new=1',
        bg: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
      },
      {
        icon: CubeIcon,
        label: 'Productos',
        description: 'Catálogo completo con precios y especificaciones',
        to: '/products',
        actionLabel: 'Ver Catálogo',
        createTo: '/products?new=1',
        bg: 'bg-gradient-to-br from-blue-500 to-blue-600',
      },
      {
        icon: ClipboardDocumentListIcon,
        label: 'Categorías',
        description: 'Clasificación y organización de productos',
        to: '/products/categories',
        actionLabel: 'Ver Categorías',
        createTo: '/products/categories?new=1',
        bg: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
      },
      {
        icon: SwatchIcon,
        label: 'Sectores',
        description: 'Sectores industriales de la empresa de aluminio',
        to: '/sectors',
        actionLabel: 'Ver Sectores',
        bg: 'bg-gradient-to-br from-purple-500 to-purple-600',
      },
      {
        icon: BeakerIcon,
        label: 'Series de Aleación',
        description: 'Tipos y series de aleaciones de aluminio',
        to: '/series',
        actionLabel: 'Ver Series',
        bg: 'bg-gradient-to-br from-violet-500 to-violet-600',
      },
    ],
  },

  operaciones: {
    label: 'Operaciones',
    description: 'Compras, ventas, proveedores, clientes y producción',
    icon: ShoppingCartIcon,
    headerIconBg: 'bg-orange-100 dark:bg-orange-900/30',
    headerIconColor: 'text-orange-600 dark:text-orange-400',
    items: [
      {
        icon: ShoppingCartIcon,
        label: 'Compras',
        description: 'Órdenes de compra a proveedores y seguimiento',
        to: '/purchases',
        actionLabel: 'Ver Compras',
        createTo: '/purchases?new=1',
        bg: 'bg-gradient-to-br from-orange-500 to-orange-600',
      },
      {
        icon: TruckIcon,
        label: 'Proveedores',
        description: 'Directorio y gestión de proveedores de materiales',
        to: '/suppliers',
        actionLabel: 'Ver Proveedores',
        createTo: '/suppliers?new=1',
        bg: 'bg-gradient-to-br from-amber-500 to-amber-600',
      },
      {
        icon: CurrencyDollarIcon,
        label: 'Ventas',
        description: 'Órdenes de venta y cotizaciones a clientes',
        to: '/sales',
        actionLabel: 'Ver Ventas',
        createTo: '/sales?new=1',
        bg: 'bg-gradient-to-br from-green-500 to-green-600',
      },
      {
        icon: UsersIcon,
        label: 'Clientes',
        description: 'Base de clientes, crédito y condiciones comerciales',
        to: '/customers',
        actionLabel: 'Ver Clientes',
        createTo: '/customers?new=1',
        bg: 'bg-gradient-to-br from-sky-500 to-sky-600',
      },
      {
        icon: WrenchScrewdriverIcon,
        label: 'Producción',
        description: 'Órdenes de manufactura y control de calidad',
        to: '/production',
        actionLabel: 'Ver Producción',
        createTo: '/production?new=1',
        bg: 'bg-gradient-to-br from-red-500 to-red-600',
      },
    ],
  },

  analisis: {
    label: 'Análisis',
    description: 'Reportes, estadísticas y análisis del negocio',
    icon: ChartBarIcon,
    headerIconBg: 'bg-violet-100 dark:bg-violet-900/30',
    headerIconColor: 'text-violet-600 dark:text-violet-400',
    items: [
      {
        icon: ChartBarIcon,
        label: 'Reportes',
        description: 'Análisis de ventas, compras, inventario y top productos con gráficas avanzadas',
        to: '/reports',
        actionLabel: 'Ver Reportes',
        bg: 'bg-gradient-to-br from-violet-500 to-purple-600',
      },
    ],
  },

  sistema: {
    label: 'Sistema',
    description: 'Administración de usuarios y configuración del sistema',
    icon: CogIcon,
    headerIconBg: 'bg-slate-100 dark:bg-slate-700',
    headerIconColor: 'text-slate-600 dark:text-slate-300',
    items: [
      {
        icon: UsersIcon,
        label: 'Usuarios',
        description: 'Gestión de cuentas, roles y permisos de acceso',
        to: '/users',
        actionLabel: 'Ver Usuarios',
        createTo: '/users?new=1',
        bg: 'bg-gradient-to-br from-slate-600 to-slate-700',
        roles: ['ADMIN'],
      },
      {
        icon: CogIcon,
        label: 'Configuración',
        description: 'Ajustes generales, CFDI, empresa y preferencias',
        to: '/settings',
        actionLabel: 'Configurar',
        bg: 'bg-gradient-to-br from-gray-500 to-gray-600',
      },
    ],
  },
}

const section      = computed(() => (route.meta.section as string) ?? 'general')
const cfg          = computed(() => allSections[section.value] ?? allSections.general)
const visibleItems = computed(() =>
  cfg.value.items.filter(item => !item.roles || auth.can(item.roles))
)
</script>
