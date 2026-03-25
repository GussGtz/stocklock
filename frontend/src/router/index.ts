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
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/views/DashboardView.vue'),
          meta: { title: 'Dashboard' },
        },
        // Inventory
        {
          path: 'inventory',
          name: 'inventory',
          component: () => import('@/views/inventory/InventoryView.vue'),
          meta: { title: 'Inventario' },
        },
        {
          path: 'inventory/kardex/:productId',
          name: 'kardex',
          component: () => import('@/views/inventory/KardexView.vue'),
          meta: { title: 'Kardex' },
        },
        {
          path: 'inventory/movements',
          name: 'movements',
          component: () => import('@/views/inventory/MovementsView.vue'),
          meta: { title: 'Movimientos' },
        },
        {
          path: 'inventory/warehouses',
          name: 'warehouses',
          component: () => import('@/views/inventory/WarehousesView.vue'),
          meta: { title: 'Almacenes' },
        },
        // Products
        {
          path: 'products',
          name: 'products',
          component: () => import('@/views/products/ProductsView.vue'),
          meta: { title: 'Productos' },
        },
        {
          path: 'products/categories',
          name: 'categories',
          component: () => import('@/views/products/CategoriesView.vue'),
          meta: { title: 'Categorías' },
        },
        // Purchases
        {
          path: 'purchases',
          name: 'purchases',
          component: () => import('@/views/purchases/PurchasesView.vue'),
          meta: { title: 'Compras' },
        },
        {
          path: 'purchases/:id',
          name: 'purchase-detail',
          component: () => import('@/views/purchases/PurchaseDetailView.vue'),
          meta: { title: 'Detalle de Compra' },
        },
        {
          path: 'suppliers',
          name: 'suppliers',
          component: () => import('@/views/purchases/SuppliersView.vue'),
          meta: { title: 'Proveedores' },
        },
        // Sales
        {
          path: 'sales',
          name: 'sales',
          component: () => import('@/views/sales/SalesView.vue'),
          meta: { title: 'Ventas' },
        },
        {
          path: 'sales/:id',
          name: 'sale-detail',
          component: () => import('@/views/sales/SaleDetailView.vue'),
          meta: { title: 'Detalle de Venta' },
        },
        {
          path: 'customers',
          name: 'customers',
          component: () => import('@/views/sales/CustomersView.vue'),
          meta: { title: 'Clientes' },
        },
        // Production
        {
          path: 'production',
          name: 'production',
          component: () => import('@/views/production/ProductionView.vue'),
          meta: { title: 'Producción' },
        },
        {
          path: 'production/:id',
          name: 'production-detail',
          component: () => import('@/views/production/ProductionDetailView.vue'),
          meta: { title: 'Orden de Producción' },
        },
        // Reports
        {
          path: 'reports',
          name: 'reports',
          component: () => import('@/views/reports/ReportsView.vue'),
          meta: { title: 'Reportes' },
        },
        // Users
        {
          path: 'users',
          name: 'users',
          component: () => import('@/views/users/UsersView.vue'),
          meta: { title: 'Usuarios', roles: ['ADMIN'] },
        },
        // Sectors
        {
          path: 'sectors',
          name: 'sectors',
          component: () => import('@/views/sectors/SectorsView.vue'),
          meta: { title: 'Sectores de Aluminio', requiresAuth: true },
        },
        // Series
        {
          path: 'series',
          name: 'series',
          component: () => import('@/views/series/SeriesView.vue'),
          meta: { title: 'Series de Aleación' },
        },
        // Alerts
        {
          path: 'alerts',
          name: 'alerts',
          component: () => import('@/views/AlertsView.vue'),
          meta: { title: 'Alertas' },
        },
        // Settings
        {
          path: 'settings',
          name: 'settings',
          component: () => import('@/views/SettingsView.vue'),
          meta: { title: 'Configuración' },
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
