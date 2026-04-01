<template>
  <div class="space-y-6">
    <!-- Section header -->
    <div class="flex items-center gap-4">
      <div :class="['w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm', cfg.iconBg]">
        <component :is="cfg.icon" :class="['w-7 h-7', cfg.iconColor]" />
      </div>
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{{ cfg.label }}</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{{ cfg.description }}</p>
      </div>
    </div>

    <!-- Cards grid -->
    <div :class="[
      'grid gap-4',
      visibleItems.length === 1 ? 'grid-cols-1 max-w-sm' :
      visibleItems.length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl' :
      'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
    ]">
      <div
        v-for="item in visibleItems"
        :key="item.to"
        class="group relative bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700/60
               rounded-2xl shadow-sm hover:shadow-lg cursor-pointer
               transition-all duration-200 hover:-translate-y-0.5 overflow-hidden"
        @click="router.push(item.to)"
      >
        <!-- Top color accent bar -->
        <div :class="['absolute top-0 left-0 right-0 h-1', cfg.accentBar]" />

        <div class="p-5 pt-6 flex flex-col gap-4 h-full">
          <!-- Icon + Badge -->
          <div class="flex items-start justify-between">
            <div :class="['w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110', item.iconBg ?? cfg.iconBg]">
              <component :is="item.icon" :class="['w-6 h-6', item.iconColor ?? cfg.iconColor]" />
            </div>
            <span
              v-if="item.badge && item.badge > 0"
              class="min-w-[22px] h-[22px] px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
            >
              {{ item.badge > 99 ? '99+' : item.badge }}
            </span>
          </div>

          <!-- Title & description -->
          <div class="flex-1">
            <h3 class="font-bold text-slate-900 dark:text-white text-base leading-snug group-hover:text-opacity-90">
              {{ item.label }}
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1.5 leading-snug">
              {{ item.description }}
            </p>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2 pt-1 border-t border-gray-100 dark:border-slate-700/60">
            <button
              @click.stop="router.push(item.to)"
              :class="['flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-semibold transition-colors duration-150', cfg.btnPrimary]"
            >
              <ArrowRightIcon class="w-3.5 h-3.5" />
              {{ item.actionLabel ?? 'Abrir' }}
            </button>
            <button
              v-if="item.createTo"
              @click.stop="router.push(item.createTo)"
              :class="['flex items-center justify-center gap-1 py-2 px-3 rounded-lg text-sm font-semibold transition-colors duration-150', cfg.btnSecondary]"
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
import { useAuthStore } from '@/stores/auth'
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
  iconBg?: string
  iconColor?: string
  badge?: number
  roles?: string[]
}

interface SectionConfig {
  label: string
  description: string
  icon: any
  iconBg: string
  iconColor: string
  accentBar: string
  btnPrimary: string
  btnSecondary: string
  items: CardItem[]
}

const allSections: Record<string, SectionConfig> = {
  general: {
    label: 'General',
    description: 'Panel principal y notificaciones del sistema',
    icon: HomeIcon,
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
    accentBar: 'bg-gradient-to-r from-blue-500 to-blue-400',
    btnPrimary: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40',
    btnSecondary: 'bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600',
    items: [
      {
        icon: HomeIcon,
        label: 'Dashboard',
        description: 'Resumen general del sistema con KPIs y gráficas en tiempo real',
        to: '/dashboard',
        actionLabel: 'Ver Dashboard',
      },
      {
        icon: BellIcon,
        label: 'Alertas',
        description: 'Notificaciones de stock bajo, vencimientos y avisos importantes',
        to: '/alerts',
        actionLabel: 'Ver Alertas',
        get badge() { return alertsStore.unreadCount },
      },
    ],
  },

  inventario: {
    label: 'Inventario',
    description: 'Gestión completa de productos, stock, movimientos y almacenes',
    icon: ArchiveBoxIcon,
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    accentBar: 'bg-gradient-to-r from-emerald-500 to-emerald-400',
    btnPrimary: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40',
    btnSecondary: 'bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600',
    items: [
      {
        icon: ArchiveBoxIcon,
        label: 'Stock Actual',
        description: 'Consulta el inventario disponible por producto y almacén',
        to: '/inventory',
        actionLabel: 'Ver Stock',
      },
      {
        icon: ArrowsRightLeftIcon,
        label: 'Movimientos',
        description: 'Historial de entradas, salidas y transferencias de productos',
        to: '/inventory/movements',
        actionLabel: 'Ver Historial',
      },
      {
        icon: BuildingStorefrontIcon,
        label: 'Almacenes',
        description: 'Gestión de ubicaciones físicas y capacidades de almacenamiento',
        to: '/inventory/warehouses',
        actionLabel: 'Administrar',
        createTo: '/inventory/warehouses?new=1',
      },
      {
        icon: CubeIcon,
        label: 'Productos',
        description: 'Catálogo completo de productos con precios y especificaciones',
        to: '/products',
        actionLabel: 'Ver Catálogo',
        createTo: '/products?new=1',
      },
      {
        icon: ClipboardDocumentListIcon,
        label: 'Categorías',
        description: 'Clasificación y organización de productos por categoría',
        to: '/products/categories',
        actionLabel: 'Ver Categorías',
        createTo: '/products/categories?new=1',
      },
      {
        icon: SwatchIcon,
        label: 'Sectores',
        description: 'Sectores industriales de la empresa de aluminio',
        to: '/sectors',
        actionLabel: 'Ver Sectores',
      },
      {
        icon: BeakerIcon,
        label: 'Series de Aleación',
        description: 'Tipos y series de aleaciones de aluminio manejadas',
        to: '/series',
        actionLabel: 'Ver Series',
      },
    ],
  },

  operaciones: {
    label: 'Operaciones',
    description: 'Compras, ventas, proveedores, clientes y producción',
    icon: ShoppingCartIcon,
    iconBg: 'bg-orange-100 dark:bg-orange-900/30',
    iconColor: 'text-orange-600 dark:text-orange-400',
    accentBar: 'bg-gradient-to-r from-orange-500 to-orange-400',
    btnPrimary: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/40',
    btnSecondary: 'bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600',
    items: [
      {
        icon: ShoppingCartIcon,
        label: 'Compras',
        description: 'Órdenes de compra a proveedores y seguimiento de pedidos',
        to: '/purchases',
        actionLabel: 'Ver Compras',
        createTo: '/purchases?new=1',
      },
      {
        icon: TruckIcon,
        label: 'Proveedores',
        description: 'Directorio y gestión de proveedores de materiales',
        to: '/suppliers',
        actionLabel: 'Ver Proveedores',
        createTo: '/suppliers?new=1',
      },
      {
        icon: CurrencyDollarIcon,
        label: 'Ventas',
        description: 'Órdenes de venta, cotizaciones y seguimiento de clientes',
        to: '/sales',
        actionLabel: 'Ver Ventas',
        createTo: '/sales?new=1',
      },
      {
        icon: UsersIcon,
        label: 'Clientes',
        description: 'Base de datos de clientes, crédito y condiciones comerciales',
        to: '/customers',
        actionLabel: 'Ver Clientes',
        createTo: '/customers?new=1',
      },
      {
        icon: WrenchScrewdriverIcon,
        label: 'Producción',
        description: 'Órdenes de manufactura, procesos y control de calidad',
        to: '/production',
        actionLabel: 'Ver Producción',
        createTo: '/production?new=1',
      },
    ],
  },

  analisis: {
    label: 'Análisis',
    description: 'Reportes, estadísticas y análisis del negocio',
    icon: ChartBarIcon,
    iconBg: 'bg-violet-100 dark:bg-violet-900/30',
    iconColor: 'text-violet-600 dark:text-violet-400',
    accentBar: 'bg-gradient-to-r from-violet-500 to-violet-400',
    btnPrimary: 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/40',
    btnSecondary: 'bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600',
    items: [
      {
        icon: ChartBarIcon,
        label: 'Reportes',
        description: 'Análisis de ventas, compras, inventario y top productos con gráficas avanzadas',
        to: '/reports',
        actionLabel: 'Ver Reportes',
      },
    ],
  },

  sistema: {
    label: 'Sistema',
    description: 'Administración de usuarios y configuración del sistema',
    icon: CogIcon,
    iconBg: 'bg-slate-100 dark:bg-slate-700',
    iconColor: 'text-slate-600 dark:text-slate-300',
    accentBar: 'bg-gradient-to-r from-slate-500 to-slate-400',
    btnPrimary: 'bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600',
    btnSecondary: 'bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600',
    items: [
      {
        icon: UsersIcon,
        label: 'Usuarios',
        description: 'Gestión de cuentas de usuario, roles y permisos de acceso',
        to: '/users',
        actionLabel: 'Ver Usuarios',
        createTo: '/users?new=1',
        roles: ['ADMIN'],
      },
      {
        icon: CogIcon,
        label: 'Configuración',
        description: 'Ajustes generales del sistema, CFDI, empresa y preferencias',
        to: '/settings',
        actionLabel: 'Configurar',
      },
    ],
  },
}

const section = computed(() => (route.meta.section as string) ?? 'general')
const cfg     = computed(() => allSections[section.value] ?? allSections.general)

const visibleItems = computed(() =>
  cfg.value.items.filter(item => !item.roles || auth.can(item.roles))
)
</script>
