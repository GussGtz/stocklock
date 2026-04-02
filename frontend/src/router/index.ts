import { createRouter, createWebHistory } from 'vue-router'
import NProgress from 'nprogress'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: () => import('@/components/layout/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: '/dashboard' },

        // ── Section Hubs ──────────────────────────────────────────────
        {
          path: 'general',
          name: 'hub-general',
          component: () => import('@/views/hub/SectionHubView.vue'),
          meta: { title: 'General', section: 'general' },
        },
        {
          path: 'inventario',
          name: 'hub-inventario',
          component: () => import('@/views/hub/SectionHubView.vue'),
          meta: { title: 'Inventario', section: 'inventario' },
        },
        {
          path: 'operaciones',
          name: 'hub-operaciones',
          component: () => import('@/views/hub/SectionHubView.vue'),
          meta: { title: 'Operaciones', section: 'operaciones' },
        },
        {
          path: 'analisis',
          name: 'hub-analisis',
          component: () => import('@/views/hub/SectionHubView.vue'),
          meta: { title: 'Análisis', section: 'analisis' },
        },
        {
          path: 'sistema',
          name: 'hub-sistema',
          component: () => import('@/views/hub/SectionHubView.vue'),
          meta: { title: 'Sistema', section: 'sistema' },
        },

        // ── General ───────────────────────────────────────────────────
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/views/DashboardView.vue'),
          meta: { title: 'Dashboard', section: 'general' },
        },
        {
          path: 'alerts',
          name: 'alerts',
          component: () => import('@/views/AlertsView.vue'),
          meta: { title: 'Alertas', section: 'general' },
        },

        // ── Inventario ────────────────────────────────────────────────
        {
          path: 'inventory',
          name: 'inventory',
          component: () => import('@/views/inventory/InventoryView.vue'),
          meta: { title: 'Stock Actual', section: 'inventario' },
        },
        {
          path: 'inventory/kardex/:productId',
          name: 'kardex',
          component: () => import('@/views/inventory/KardexView.vue'),
          meta: { title: 'Kardex', section: 'inventario' },
        },
        {
          path: 'inventory/movements',
          name: 'movements',
          component: () => import('@/views/inventory/MovementsView.vue'),
          meta: { title: 'Movimientos', section: 'inventario' },
        },
        {
          path: 'inventory/warehouses',
          name: 'warehouses',
          component: () => import('@/views/inventory/WarehousesView.vue'),
          meta: { title: 'Almacenes', section: 'inventario' },
        },
        {
          path: 'products',
          name: 'products',
          component: () => import('@/views/products/ProductsView.vue'),
          meta: { title: 'Productos', section: 'inventario' },
        },
        {
          path: 'products/categories',
          name: 'categories',
          component: () => import('@/views/products/CategoriesView.vue'),
          meta: { title: 'Categorías', section: 'inventario' },
        },
        {
          path: 'sectors',
          name: 'sectors',
          component: () => import('@/views/sectors/SectorsView.vue'),
          meta: { title: 'Sectores', section: 'inventario' },
        },
        {
          path: 'series',
          name: 'series',
          component: () => import('@/views/series/SeriesView.vue'),
          meta: { title: 'Series de Aleación', section: 'inventario' },
        },

        // ── Operaciones ───────────────────────────────────────────────
        {
          path: 'purchases',
          name: 'purchases',
          component: () => import('@/views/purchases/PurchasesView.vue'),
          meta: { title: 'Compras', section: 'operaciones' },
        },
        {
          path: 'purchases/:id',
          name: 'purchase-detail',
          component: () => import('@/views/purchases/PurchaseDetailView.vue'),
          meta: { title: 'Detalle de Compra', section: 'operaciones' },
        },
        {
          path: 'suppliers',
          name: 'suppliers',
          component: () => import('@/views/purchases/SuppliersView.vue'),
          meta: { title: 'Proveedores', section: 'operaciones' },
        },
        {
          path: 'sales',
          name: 'sales',
          component: () => import('@/views/sales/SalesView.vue'),
          meta: { title: 'Ventas', section: 'operaciones' },
        },
        {
          path: 'sales/:id',
          name: 'sale-detail',
          component: () => import('@/views/sales/SaleDetailView.vue'),
          meta: { title: 'Detalle de Venta', section: 'operaciones' },
        },
        {
          path: 'customers',
          name: 'customers',
          component: () => import('@/views/sales/CustomersView.vue'),
          meta: { title: 'Clientes', section: 'operaciones' },
        },
        {
          path: 'quotes',
          name: 'quotes',
          component: () => import('@/views/quotes/QuotesView.vue'),
          meta: { title: 'Cotizaciones', section: 'operaciones' },
        },
        {
          path: 'quotes/:id',
          name: 'quote-detail',
          component: () => import('@/views/quotes/QuoteDetailView.vue'),
          meta: { title: 'Detalle de Cotización', section: 'operaciones' },
        },
        {
          path: 'production',
          name: 'production',
          component: () => import('@/views/production/ProductionView.vue'),
          meta: { title: 'Producción', section: 'operaciones' },
        },
        {
          path: 'production/:id',
          name: 'production-detail',
          component: () => import('@/views/production/ProductionDetailView.vue'),
          meta: { title: 'Orden de Producción', section: 'operaciones' },
        },

        // ── Análisis ──────────────────────────────────────────────────
        {
          path: 'reports',
          name: 'reports',
          component: () => import('@/views/reports/ReportsView.vue'),
          meta: { title: 'Reportes', section: 'analisis' },
        },

        // ── Sistema ───────────────────────────────────────────────────
        {
          path: 'users',
          name: 'users',
          component: () => import('@/views/users/UsersView.vue'),
          meta: { title: 'Usuarios', section: 'sistema', roles: ['ADMIN'] },
        },
        {
          path: 'settings',
          name: 'settings',
          component: () => import('@/views/SettingsView.vue'),
          meta: { title: 'Configuración', section: 'sistema' },
        },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach(async (to, _from, next) => {
  NProgress.start()
  const auth = useAuthStore()
  if (to.meta.public) return next()
  if (!auth.isAuthenticated) {
    if (!auth.token) return next('/login')
    await auth.fetchProfile()
    if (!auth.isAuthenticated) return next('/login')
  }
  if (to.meta.roles && !auth.can(to.meta.roles as string[])) {
    return next('/dashboard')
  }
  next()
})

router.afterEach(() => NProgress.done())

export default router
