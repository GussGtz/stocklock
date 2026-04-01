<template>
  <div class="space-y-7">

    <!-- Section header -->
    <div class="flex items-center gap-4">
      <div :class="['w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', cfg.headerIconBg]">
        <component :is="cfg.icon" :class="['w-5 h-5', cfg.headerIconColor]" />
      </div>
      <div>
        <h1 class="text-xl font-bold text-slate-800 dark:text-white leading-tight">{{ cfg.label }}</h1>
        <p class="text-sm text-slate-500 dark:text-gray-400 mt-0.5">{{ cfg.description }}</p>
      </div>
    </div>

    <!-- Cards grid — landscape atlas style -->
    <div class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      <div
        v-for="item in visibleItems"
        :key="item.to"
        class="group relative rounded-2xl overflow-hidden cursor-pointer
               transition-all duration-200 hover:-translate-y-1 hover:shadow-xl shadow-md"
        :style="{ backgroundColor: item.color }"
        @click="router.push(item.to)"
      >
        <!-- Large decorative icon — bottom right -->
        <div class="absolute -bottom-3 -right-3 opacity-20 pointer-events-none
                    transition-transform duration-300 group-hover:scale-110 group-hover:opacity-30">
          <component :is="item.icon" class="w-28 h-28 text-white" />
        </div>

        <!-- Card content -->
        <div class="relative z-10 p-5 flex flex-col gap-3 min-h-[148px]">

          <!-- Small icon top-left -->
          <div class="w-10 h-10 rounded-xl bg-white/25 flex items-center justify-center flex-shrink-0">
            <component :is="item.icon" class="w-5 h-5 text-white" />
          </div>

          <!-- Text -->
          <div class="flex-1">
            <div class="flex items-start gap-2">
              <h3 class="font-bold text-white text-[15px] leading-snug flex-1">{{ item.label }}</h3>
              <span v-if="item.badge && item.badge > 0"
                class="flex-shrink-0 min-w-[20px] h-5 px-1.5 bg-white/30 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {{ item.badge > 99 ? '99+' : item.badge }}
              </span>
            </div>
            <p class="text-[12px] text-white/70 mt-1 leading-snug line-clamp-2">{{ item.description }}</p>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2">
            <button
              @click.stop="router.push(item.to)"
              class="flex items-center gap-1 py-1 px-3 rounded-lg
                     bg-white/20 hover:bg-white/35 text-white text-[11px] font-semibold
                     transition-colors duration-150"
            >
              {{ item.actionLabel ?? 'Abrir' }}
              <ArrowRightIcon class="w-3 h-3" />
            </button>
            <button
              v-if="item.createTo"
              @click.stop="router.push(item.createTo)"
              class="flex items-center gap-1 py-1 px-2.5 rounded-lg
                     bg-white/20 hover:bg-white/35 text-white text-[11px] font-semibold
                     transition-colors duration-150"
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

const route        = useRoute()
const router       = useRouter()
const auth         = useAuthStore()
const alertsStore  = useAlertsStore()

interface CardItem {
  icon: any
  label: string
  description: string
  to: string
  createTo?: string
  actionLabel?: string
  color: string       // solid hex color — atlas style
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
        color: '#0EA5E9',
      },
      {
        icon: BellIcon,
        label: 'Alertas',
        description: 'Notificaciones de stock bajo y avisos importantes',
        to: '/alerts',
        actionLabel: 'Ver Alertas',
        color: '#F97316',
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
        color: '#10B981',
      },
      {
        icon: ArrowsRightLeftIcon,
        label: 'Movimientos',
        description: 'Historial de entradas, salidas y transferencias',
        to: '/inventory/movements',
        actionLabel: 'Ver Historial',
        color: '#14B8A6',
      },
      {
        icon: BuildingStorefrontIcon,
        label: 'Almacenes',
        description: 'Gestión de ubicaciones físicas y capacidades',
        to: '/inventory/warehouses',
        actionLabel: 'Administrar',
        createTo: '/inventory/warehouses?new=1',
        color: '#06B6D4',
      },
      {
        icon: CubeIcon,
        label: 'Productos',
        description: 'Catálogo completo con precios y especificaciones',
        to: '/products',
        actionLabel: 'Ver Catálogo',
        createTo: '/products?new=1',
        color: '#3B82F6',
      },
      {
        icon: ClipboardDocumentListIcon,
        label: 'Categorías',
        description: 'Clasificación y organización de productos',
        to: '/products/categories',
        actionLabel: 'Ver Categorías',
        createTo: '/products/categories?new=1',
        color: '#6366F1',
      },
      {
        icon: SwatchIcon,
        label: 'Sectores',
        description: 'Sectores industriales de la empresa de aluminio',
        to: '/sectors',
        actionLabel: 'Ver Sectores',
        color: '#8B5CF6',
      },
      {
        icon: BeakerIcon,
        label: 'Series de Aleación',
        description: 'Tipos y series de aleaciones de aluminio',
        to: '/series',
        actionLabel: 'Ver Series',
        color: '#A855F7',
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
        color: '#F97316',
      },
      {
        icon: TruckIcon,
        label: 'Proveedores',
        description: 'Directorio y gestión de proveedores de materiales',
        to: '/suppliers',
        actionLabel: 'Ver Proveedores',
        createTo: '/suppliers?new=1',
        color: '#F59E0B',
      },
      {
        icon: CurrencyDollarIcon,
        label: 'Ventas',
        description: 'Órdenes de venta y cotizaciones a clientes',
        to: '/sales',
        actionLabel: 'Ver Ventas',
        createTo: '/sales?new=1',
        color: '#22C55E',
      },
      {
        icon: UsersIcon,
        label: 'Clientes',
        description: 'Base de clientes, crédito y condiciones comerciales',
        to: '/customers',
        actionLabel: 'Ver Clientes',
        createTo: '/customers?new=1',
        color: '#EC4899',
      },
      {
        icon: WrenchScrewdriverIcon,
        label: 'Producción',
        description: 'Órdenes de manufactura y control de calidad',
        to: '/production',
        actionLabel: 'Ver Producción',
        createTo: '/production?new=1',
        color: '#EF4444',
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
        color: '#8B5CF6',
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
        color: '#64748B',
        roles: ['ADMIN'],
      },
      {
        icon: CogIcon,
        label: 'Configuración',
        description: 'Ajustes generales, CFDI, empresa y preferencias',
        to: '/settings',
        actionLabel: 'Configurar',
        color: '#475569',
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
