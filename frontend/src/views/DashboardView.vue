<template>
  <div class="space-y-5">

    <!-- ═══════════════════════════════════════════════════════════
         HEADER
    ══════════════════════════════════════════════════════════════ -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
          Buenas {{ greeting }}, {{ auth.user?.firstName }}
        </h1>
        <p class="text-sm text-slate-400 dark:text-slate-500 mt-0.5 capitalize">{{ today }}</p>
      </div>
      <button @click="refresh" :disabled="loading"
        class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300
               bg-white dark:bg-slate-800 border border-[#E8EDF2] dark:border-slate-700
               rounded-xl shadow-card hover:shadow-card-md hover:border-sky-200 transition-all duration-150 disabled:opacity-60">
        <ArrowPathIcon :class="['w-4 h-4 text-sky-500', loading && 'animate-spin']" />
        Actualizar
      </button>
    </div>

    <!-- ═══════════════════════════════════════════════════════════
         ROW 1 — KPI CARDS con mini sparklines
    ══════════════════════════════════════════════════════════════ -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">

      <!-- KPI: Total Productos -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-[#E8EDF2] dark:border-slate-700/70 shadow-card">
        <div class="flex items-start justify-between mb-3">
          <div class="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center">
            <CubeIcon class="w-4.5 h-4.5 text-sky-500" />
          </div>
          <span :class="['inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full',
            kpis.totalProducts > 0 ? 'bg-sky-50 text-sky-600 dark:bg-sky-900/30' : 'bg-gray-100 text-gray-500']">
            <CubeIcon class="w-3 h-3" />
            Activos
          </span>
        </div>
        <p class="text-[28px] font-bold text-slate-800 dark:text-white leading-none">{{ loading ? '—' : kpis.totalProducts }}</p>
        <p class="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1.5 uppercase tracking-wider">Total Productos</p>
        <div class="mt-3 pt-3 border-t border-[#F0F4F8] dark:border-slate-700/50">
          <span class="text-[11px] text-slate-400">Valor inventario</span>
          <span class="text-[11px] font-bold text-slate-600 dark:text-slate-300 ml-1">{{ loading ? '—' : formatCurrency(kpis.inventoryValue) }}</span>
        </div>
      </div>

      <!-- KPI: Ventas del Mes + sparkline -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-[#E8EDF2] dark:border-slate-700/70 shadow-card">
        <div class="flex items-start justify-between mb-3">
          <div class="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
            <CurrencyDollarIcon class="w-4.5 h-4.5 text-emerald-500" />
          </div>
          <span class="inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30">
            <ArrowTrendingUpIcon class="w-3 h-3" />
            Este mes
          </span>
        </div>
        <p class="text-[28px] font-bold text-slate-800 dark:text-white leading-none">{{ loading ? '—' : formatCurrency(kpis.salesTotal) }}</p>
        <p class="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1.5 uppercase tracking-wider">Ventas del Mes</p>
        <!-- mini sparkline -->
        <div class="mt-2 h-10">
          <Line v-if="!loading && salesSparkData" :data="salesSparkData" :options="sparkOptions" />
          <div v-else class="h-full skeleton rounded" />
        </div>
      </div>

      <!-- KPI: Compras del Mes -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-[#E8EDF2] dark:border-slate-700/70 shadow-card">
        <div class="flex items-start justify-between mb-3">
          <div class="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
            <ShoppingCartIcon class="w-4.5 h-4.5 text-amber-500" />
          </div>
          <span class="inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-900/30">
            <TruckIcon class="w-3 h-3" />
            {{ loading ? '—' : kpis.purchasesCount }} órdenes
          </span>
        </div>
        <p class="text-[28px] font-bold text-slate-800 dark:text-white leading-none">{{ loading ? '—' : formatCurrency(kpis.purchasesTotal) }}</p>
        <p class="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1.5 uppercase tracking-wider">Compras del Mes</p>
        <div class="mt-3 pt-3 border-t border-[#F0F4F8] dark:border-slate-700/50 flex items-center justify-between">
          <span class="text-[11px] text-slate-400">Pendientes</span>
          <span class="text-[11px] font-bold text-amber-600">{{ loading ? '—' : kpis.pendingPurchases }}</span>
        </div>
      </div>

      <!-- KPI: Alertas + Movimientos -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-[#E8EDF2] dark:border-slate-700/70 shadow-card">
        <div class="flex items-start justify-between mb-3">
          <div class="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
            <BellAlertIcon class="w-4.5 h-4.5 text-red-500" />
          </div>
          <span :class="['inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full',
            kpis.activeAlerts > 0 ? 'bg-red-50 text-red-600 dark:bg-red-900/30' : 'bg-emerald-50 text-emerald-600']">
            {{ kpis.activeAlerts > 0 ? 'Requiere atención' : 'Sin alertas' }}
          </span>
        </div>
        <p class="text-[28px] font-bold text-slate-800 dark:text-white leading-none">{{ loading ? '—' : kpis.activeAlerts }}</p>
        <p class="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1.5 uppercase tracking-wider">Alertas Activas</p>
        <div class="mt-3 pt-3 border-t border-[#F0F4F8] dark:border-slate-700/50 flex items-center justify-between">
          <span class="text-[11px] text-slate-400">Movimientos hoy</span>
          <span class="text-[11px] font-bold text-violet-600">{{ loading ? '—' : kpis.movementsToday }}</span>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════
         ROW 2 — Tendencia de Ventas (2/3) + Estado Stock (1/3)
    ══════════════════════════════════════════════════════════════ -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">

      <!-- Sales trend — wide -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl border border-[#E8EDF2] dark:border-slate-700/70 shadow-card xl:col-span-2 p-5">
        <div class="flex items-center justify-between mb-1">
          <div>
            <h3 class="text-sm font-bold text-slate-700 dark:text-white">Tendencia de Ventas</h3>
            <p class="text-xs text-slate-400 mt-0.5 capitalize">{{ currentMonth }}</p>
          </div>
          <div class="flex items-center gap-4 text-xs text-slate-400">
            <span class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-sky-500"></span>Este mes
            </span>
          </div>
        </div>
        <div class="h-56 mt-3">
          <Line v-if="!loading && lineData" :data="lineData" :options="lineOptions" />
          <div v-else class="skeleton h-full rounded-xl" />
        </div>
      </div>

      <!-- Stock donut -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl border border-[#E8EDF2] dark:border-slate-700/70 shadow-card p-5">
        <h3 class="text-sm font-bold text-slate-700 dark:text-white mb-4">Estado del Stock</h3>
        <div class="relative flex items-center justify-center h-40">
          <Doughnut v-if="!loading && donutData" :data="donutData" :options="donutOptions" />
          <div v-else class="skeleton w-36 h-36 rounded-full" />
          <div v-if="!loading" class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span class="text-2xl font-bold text-slate-800 dark:text-white">{{ kpis.totalProducts }}</span>
            <span class="text-[10px] text-slate-400 font-medium">productos</span>
          </div>
        </div>
        <div class="mt-4 space-y-2">
          <div v-for="item in stockStatusLegend" :key="item.label"
            class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span :class="['w-2 h-2 rounded-full flex-shrink-0', item.dot]"></span>
              <span class="text-xs text-slate-500 dark:text-slate-400">{{ item.label }}</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-16 h-1.5 rounded-full bg-[#F0F4F8] dark:bg-slate-700 overflow-hidden">
                <div :class="['h-full rounded-full', item.bar]"
                     :style="{ width: `${Math.min((item.value / Math.max(kpis.totalProducts, 1)) * 100, 100)}%` }"></div>
              </div>
              <span class="text-xs font-bold text-slate-700 dark:text-slate-200 w-6 text-right">{{ item.value }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════
         ROW 3 — Inventario por Categoría + Top Productos
    ══════════════════════════════════════════════════════════════ -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">

      <div class="bg-white dark:bg-slate-800 rounded-2xl border border-[#E8EDF2] dark:border-slate-700/70 shadow-card p-5">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-sm font-bold text-slate-700 dark:text-white">Inventario por Categoría</h3>
            <p class="text-xs text-slate-400 mt-0.5">Unidades en stock</p>
          </div>
          <span class="text-[11px] font-semibold text-sky-600 bg-sky-50 dark:bg-sky-900/20 px-2.5 py-1 rounded-full">Unidades</span>
        </div>
        <div class="h-52">
          <Bar v-if="!loading && barData" :data="barData" :options="barOptions" />
          <div v-else class="skeleton h-full rounded-xl" />
        </div>
      </div>

      <div class="bg-white dark:bg-slate-800 rounded-2xl border border-[#E8EDF2] dark:border-slate-700/70 shadow-card p-5">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-sm font-bold text-slate-700 dark:text-white">Top 5 Productos Vendidos</h3>
            <p class="text-xs text-slate-400 mt-0.5">Por ingresos este mes</p>
          </div>
          <span class="text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full">Este mes</span>
        </div>
        <div class="h-52">
          <Bar v-if="!loading && topProductsData" :data="topProductsData" :options="horizontalBarOptions" />
          <div v-else-if="loading" class="skeleton h-full rounded-xl" />
          <div v-else class="flex flex-col items-center justify-center h-full text-slate-300 gap-3">
            <ChartBarIcon class="w-12 h-12" />
            <p class="text-sm font-medium">Sin ventas registradas este mes</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════
         ROW 4 — RING METRICS (the WOW factor — like reference)
    ══════════════════════════════════════════════════════════════ -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">

      <!-- Ring 1: Salud del Stock -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl border border-[#E8EDF2] dark:border-slate-700/70 shadow-card p-5 text-center">
        <div class="relative inline-flex items-center justify-center w-28 h-28 mx-auto">
          <Doughnut :data="ringStockData" :options="ringOptions" />
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <span class="text-xl font-bold text-slate-800 dark:text-white">{{ loading ? '—' : ringValues.stockHealth }}%</span>
          </div>
        </div>
        <p class="text-sm font-bold text-slate-700 dark:text-white mt-3">Salud de Stock</p>
        <p class="text-xs text-slate-400 mt-0.5">Productos en nivel óptimo</p>
        <div class="mt-3 pt-3 border-t border-[#F0F4F8] dark:border-slate-700/50">
          <span :class="['text-[11px] font-bold px-2 py-0.5 rounded-full', ringValues.stockHealth >= 70 ? 'bg-emerald-50 text-emerald-600' : ringValues.stockHealth >= 40 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600']">
            {{ ringValues.stockHealth >= 70 ? 'Excelente' : ringValues.stockHealth >= 40 ? 'Regular' : 'Crítico' }}
          </span>
        </div>
      </div>

      <!-- Ring 2: Ventas Completadas -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl border border-[#E8EDF2] dark:border-slate-700/70 shadow-card p-5 text-center">
        <div class="relative inline-flex items-center justify-center w-28 h-28 mx-auto">
          <Doughnut :data="ringSalesData" :options="ringOptions" />
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <span class="text-xl font-bold text-slate-800 dark:text-white">{{ loading ? '—' : kpis.salesCount }}</span>
          </div>
        </div>
        <p class="text-sm font-bold text-slate-700 dark:text-white mt-3">Ventas del Mes</p>
        <p class="text-xs text-slate-400 mt-0.5">Órdenes registradas</p>
        <div class="mt-3 pt-3 border-t border-[#F0F4F8] dark:border-slate-700/50">
          <span class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-600">
            {{ kpis.pendingSales }} pendientes
          </span>
        </div>
      </div>

      <!-- Ring 3: Cobertura de Inventario -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl border border-[#E8EDF2] dark:border-slate-700/70 shadow-card p-5 text-center">
        <div class="relative inline-flex items-center justify-center w-28 h-28 mx-auto">
          <Doughnut :data="ringCoverageData" :options="ringOptions" />
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <span class="text-xl font-bold text-slate-800 dark:text-white">{{ loading ? '—' : ringValues.coverage }}%</span>
          </div>
        </div>
        <p class="text-sm font-bold text-slate-700 dark:text-white mt-3">Cobertura</p>
        <p class="text-xs text-slate-400 mt-0.5">Productos con stock disponible</p>
        <div class="mt-3 pt-3 border-t border-[#F0F4F8] dark:border-slate-700/50">
          <span class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-600">
            {{ kpis.stockZero }} sin stock
          </span>
        </div>
      </div>

      <!-- Ring 4: Stock Bajo -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl border border-[#E8EDF2] dark:border-slate-700/70 shadow-card p-5 text-center">
        <div class="relative inline-flex items-center justify-center w-28 h-28 mx-auto">
          <Doughnut :data="ringAlertData" :options="ringOptions" />
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <span class="text-xl font-bold text-slate-800 dark:text-white">{{ loading ? '—' : ringValues.alertPct }}%</span>
          </div>
        </div>
        <p class="text-sm font-bold text-slate-700 dark:text-white mt-3">Stock Bajo</p>
        <p class="text-xs text-slate-400 mt-0.5">Productos bajo el mínimo</p>
        <div class="mt-3 pt-3 border-t border-[#F0F4F8] dark:border-slate-700/50">
          <span :class="['text-[11px] font-bold px-2 py-0.5 rounded-full', ringValues.alertPct > 20 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600']">
            {{ kpis.activeAlerts }} alertas activas
          </span>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════
         ROW 5 — Ventas vs Compras + Órdenes Pendientes
    ══════════════════════════════════════════════════════════════ -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <div class="bg-white dark:bg-slate-800 rounded-2xl border border-[#E8EDF2] dark:border-slate-700/70 shadow-card p-5 xl:col-span-2">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-sm font-bold text-slate-700 dark:text-white">Ventas vs Compras</h3>
            <p class="text-xs text-slate-400 mt-0.5">Últimos 6 meses</p>
          </div>
          <div class="flex items-center gap-4 text-xs text-slate-400">
            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>Ventas</span>
            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm bg-amber-400"></span>Compras</span>
          </div>
        </div>
        <div class="h-48">
          <Bar v-if="!loading && salesVsPurchasesData" :data="salesVsPurchasesData" :options="groupedBarOptions" />
          <div v-else class="skeleton h-full rounded-xl" />
        </div>
      </div>

      <!-- Órdenes Pendientes -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl border border-[#E8EDF2] dark:border-slate-700/70 shadow-card p-5">
        <h3 class="text-sm font-bold text-slate-700 dark:text-white mb-4">Resumen Operativo</h3>
        <div v-if="loading" class="space-y-3">
          <div v-for="i in 3" :key="i" class="skeleton h-14 rounded-xl" />
        </div>
        <div v-else class="space-y-3">
          <RouterLink to="/sales"
            class="flex items-center gap-3 p-3.5 rounded-xl hover:bg-[#F4F7FA] dark:hover:bg-slate-700/40 transition-colors group">
            <div class="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow">
              <CurrencyDollarIcon class="w-5 h-5 text-white" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-slate-700 dark:text-white">Ventas Pendientes</p>
              <p class="text-[11px] text-slate-400">Draft + Confirmadas</p>
            </div>
            <span class="text-2xl font-bold text-sky-600 dark:text-sky-400">{{ kpis.pendingSales }}</span>
          </RouterLink>
          <RouterLink to="/purchases"
            class="flex items-center gap-3 p-3.5 rounded-xl hover:bg-[#F4F7FA] dark:hover:bg-slate-700/40 transition-colors group">
            <div class="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow">
              <TruckIcon class="w-5 h-5 text-white" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-slate-700 dark:text-white">Compras Pendientes</p>
              <p class="text-[11px] text-slate-400">En proceso</p>
            </div>
            <span class="text-2xl font-bold text-amber-500 dark:text-amber-400">{{ kpis.pendingPurchases }}</span>
          </RouterLink>
          <RouterLink to="/inventory"
            class="flex items-center gap-3 p-3.5 rounded-xl hover:bg-[#F4F7FA] dark:hover:bg-slate-700/40 transition-colors group">
            <div class="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow">
              <ExclamationTriangleIcon class="w-5 h-5 text-white" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-slate-700 dark:text-white">Stock Bajo Mínimo</p>
              <p class="text-[11px] text-slate-400">Requieren reposición</p>
            </div>
            <span class="text-2xl font-bold text-red-500 dark:text-red-400">{{ kpis.activeAlerts }}</span>
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════
         ROW 6 — Stock Bajo + Movimientos Recientes
    ══════════════════════════════════════════════════════════════ -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">

      <!-- Low stock table -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl border border-[#E8EDF2] dark:border-slate-700/70 shadow-card p-5">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <h3 class="text-sm font-bold text-slate-700 dark:text-white">Productos con Stock Bajo</h3>
            <span v-if="lowStockItems.length > 0"
              class="min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {{ lowStockItems.length }}
            </span>
          </div>
          <RouterLink to="/inventory"
            class="text-[11px] font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 transition-colors">
            Ver inventario →
          </RouterLink>
        </div>
        <div v-if="loading" class="space-y-2.5">
          <div v-for="i in 4" :key="i" class="skeleton h-11 rounded-xl" />
        </div>
        <div v-else-if="lowStockItems.length === 0"
          class="flex flex-col items-center justify-center py-10 text-slate-300 gap-3">
          <CheckCircleIcon class="w-12 h-12 text-emerald-400" />
          <p class="text-sm font-semibold text-slate-500">Todo el inventario en niveles óptimos</p>
        </div>
        <div v-else class="space-y-2">
          <div v-for="item in lowStockItems.slice(0, 5)" :key="item.id"
            class="flex items-center gap-3 p-3 rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10">
            <div class="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
              <ExclamationTriangleIcon class="w-4 h-4 text-red-500" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-bold text-slate-700 dark:text-white truncate">{{ item.name }}</p>
              <p class="text-[10px] text-slate-400">{{ item.code }}</p>
            </div>
            <div class="text-right flex-shrink-0">
              <p class="text-sm font-bold text-red-500">{{ item.currentStock }}</p>
              <p class="text-[10px] text-slate-400">Mín: {{ item.minStock }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent movements -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl border border-[#E8EDF2] dark:border-slate-700/70 shadow-card p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-bold text-slate-700 dark:text-white">Movimientos Recientes</h3>
          <RouterLink to="/inventory/movements"
            class="text-[11px] font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 transition-colors">
            Ver todos →
          </RouterLink>
        </div>
        <div v-if="loading" class="space-y-2.5">
          <div v-for="i in 5" :key="i" class="skeleton h-10 rounded-lg" />
        </div>
        <div v-else class="divide-y divide-[#F0F4F8] dark:divide-slate-700/40">
          <div v-for="mov in recentMovements" :key="mov.id"
            class="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <div :class="['w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold', movBg(mov.type)]">
              {{ mov.type === 'EXIT' ? '-' : '+' }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-semibold text-slate-700 dark:text-white truncate">{{ mov.product?.name }}</p>
              <p class="text-[10px] text-slate-400">{{ movLabel(mov.type) }} · {{ formatDate(mov.createdAt) }}</p>
            </div>
            <span :class="['text-xs font-bold', mov.type === 'EXIT' ? 'text-red-500' : 'text-emerald-600']">
              {{ mov.type === 'EXIT' ? '-' : '+' }}{{ mov.quantity }}
            </span>
          </div>
          <div v-if="recentMovements.length === 0"
            class="flex flex-col items-center justify-center py-10 text-slate-300 gap-2">
            <ArrowsRightLeftIcon class="w-10 h-10" />
            <p class="text-sm font-medium text-slate-400">Sin movimientos recientes</p>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { Bar, Doughnut, Line } from 'vue-chartjs'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend, Title, LineElement, PointElement, Filler,
} from 'chart.js'
import {
  ArrowPathIcon, ExclamationTriangleIcon, ShoppingCartIcon, TruckIcon,
  ChartBarIcon, CubeIcon, CurrencyDollarIcon, BellAlertIcon,
  ArrowTrendingUpIcon, CheckCircleIcon, ArrowsRightLeftIcon,
} from '@heroicons/vue/24/outline'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import { useAuthStore } from '@/stores/auth'
import { reportsApi, productsApi, inventoryApi } from '@/services/api'

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend, Title,
  LineElement, PointElement, Filler,
)
dayjs.locale('es')

const auth            = useAuthStore()
const loading         = ref(true)
const dashboardData   = ref<any>(null)
const salesReport     = ref<any>(null)
const lowStockItems   = ref<any[]>([])
const recentMovements = ref<any[]>([])

const today        = computed(() => dayjs().format('dddd, D [de] MMMM [de] YYYY'))
const currentMonth = computed(() => dayjs().format('MMMM YYYY'))
const greeting     = computed(() => {
  const h = dayjs().hour()
  return h < 12 ? 'días' : h < 18 ? 'tardes' : 'noches'
})

// ── KPI helpers ─────────────────────────────────────────────────────────────
const kpis = computed(() => {
  const d = dashboardData.value
  if (!d) return {
    totalProducts: 0, inventoryValue: 0,
    salesTotal: 0, salesCount: 0,
    purchasesTotal: 0, purchasesCount: 0,
    pendingSales: 0, pendingPurchases: 0,
    movementsToday: 0, activeAlerts: 0,
    stockNormal: 0, stockLow: 0, stockZero: 0, stockOver: 0,
  }
  return {
    totalProducts:    d.totalProducts ?? 0,
    inventoryValue:   d.totalInventoryValue ?? 0,
    salesTotal:       d.salesThisMonth?.total ?? 0,
    salesCount:       d.salesThisMonth?.count ?? 0,
    purchasesTotal:   d.purchasesThisMonth?.total ?? 0,
    purchasesCount:   d.purchasesThisMonth?.count ?? 0,
    pendingSales:     d.pendingSales ?? 0,
    pendingPurchases: d.pendingPurchases ?? 0,
    movementsToday:   d.movementsToday ?? 0,
    activeAlerts:     d.activeAlerts ?? d.lowStockCount ?? 0,
    stockNormal:      d.stockNormal ?? 0,
    stockLow:         d.stockLow ?? 0,
    stockZero:        d.stockZero ?? 0,
    stockOver:        d.stockOver ?? 0,
  }
})

// ── Ring computed values ─────────────────────────────────────────────────────
const ringValues = computed(() => {
  const k   = kpis.value
  const tot = Math.max(k.totalProducts, 1)
  return {
    stockHealth: Math.round((k.stockNormal / tot) * 100),
    coverage:    Math.round(((tot - k.stockZero) / tot) * 100),
    alertPct:    Math.round(((k.stockLow + k.stockZero) / tot) * 100),
  }
})

// ── Stock legend ─────────────────────────────────────────────────────────────
const stockStatusLegend = computed(() => [
  { label: 'Normal',    value: kpis.value.stockNormal, dot: 'bg-emerald-500', bar: 'bg-emerald-500' },
  { label: 'Stock bajo', value: kpis.value.stockLow,  dot: 'bg-amber-400',   bar: 'bg-amber-400'   },
  { label: 'Sin stock', value: kpis.value.stockZero,   dot: 'bg-red-500',     bar: 'bg-red-500'     },
  { label: 'Exceso',    value: kpis.value.stockOver,   dot: 'bg-sky-400',     bar: 'bg-sky-400'     },
])

// ── CHART 1: Sparkline ventas ─────────────────────────────────────────────────
const salesSparkData = computed(() => {
  const orders = salesReport.value?.orders
  if (!orders) return null
  const days = dayjs().daysInMonth()
  const totals = new Array(days).fill(0)
  for (const o of orders) {
    const d = dayjs(o.saleDate).date() - 1
    if (d >= 0 && d < days) totals[d] += Number(o.total)
  }
  return {
    labels: totals.map((_, i) => i + 1),
    datasets: [{
      data: totals,
      borderColor: '#10B981',
      backgroundColor: 'rgba(16,185,129,0.15)',
      borderWidth: 1.5,
      pointRadius: 0,
      fill: true,
      tension: 0.4,
    }],
  }
})

const sparkOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { enabled: false } },
  scales: { x: { display: false }, y: { display: false } },
  elements: { point: { radius: 0 } },
  animation: { duration: 600 },
}

// ── CHART 2: Tendencia ventas (line/area) ─────────────────────────────────────
const lineData = computed(() => {
  const orders = salesReport.value?.orders
  if (!orders) return null
  const days = dayjs().daysInMonth()
  const labels = Array.from({ length: days }, (_, i) =>
    dayjs().startOf('month').add(i, 'day').format('D MMM'),
  )
  const totals = new Array(days).fill(0)
  for (const o of orders) {
    const d = dayjs(o.saleDate).date() - 1
    if (d >= 0 && d < days) totals[d] += Number(o.total)
  }
  return {
    labels,
    datasets: [{
      label: 'Ventas',
      data: totals,
      borderColor: '#0EA5E9',
      backgroundColor: 'rgba(14,165,233,0.08)',
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: '#0EA5E9',
      fill: true,
      tension: 0.4,
    }],
  }
})

const lineOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      mode: 'index' as const, intersect: false,
      backgroundColor: '#1e293b', titleColor: '#94a3b8', bodyColor: '#fff',
      padding: 10, borderColor: 'rgba(148,163,184,0.1)', borderWidth: 1,
      callbacks: { label: (ctx: any) => ` $${Number(ctx.raw).toLocaleString('es-MX', { maximumFractionDigits: 0 })}` },
    },
  },
  scales: {
    y: {
      grid: { color: 'rgba(148,163,184,0.06)' },
      border: { display: false },
      ticks: { color: '#94a3b8', font: { size: 10 }, callback: (v: any) => `$${(v/1000).toFixed(0)}k` },
    },
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: { color: '#94a3b8', font: { size: 10 }, maxTicksLimit: 10 },
    },
  },
}

// ── CHART 3: Donut stock ──────────────────────────────────────────────────────
const donutData = computed(() => {
  const k = kpis.value
  if (!dashboardData.value) return null
  return {
    labels: ['Normal', 'Stock Bajo', 'Sin Stock', 'Exceso'],
    datasets: [{ data: [k.stockNormal, k.stockLow, k.stockZero, k.stockOver], backgroundColor: ['#10B981','#F59E0B','#EF4444','#0EA5E9'], borderWidth: 0, hoverOffset: 4 }],
  }
})

const donutOptions = { responsive: true, maintainAspectRatio: false, cutout: '75%', plugins: { legend: { display: false }, tooltip: { enabled: true } } }

// ── CHART 4: Inventario por categoría (bar) ───────────────────────────────────
const barData = computed(() => {
  const d = dashboardData.value
  if (!d?.stockByCategory) return null
  return {
    labels: d.stockByCategory.map((c: any) => c.category),
    datasets: [{
      label: 'Unidades',
      data: d.stockByCategory.map((c: any) => c.quantity),
      backgroundColor: ['#0EA5E9','#10B981','#F59E0B','#8B5CF6','#EF4444','#06B6D4','#F97316'],
      borderRadius: 8,
      borderSkipped: false,
    }],
  }
})

const barOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1e293b', titleColor: '#94a3b8', bodyColor: '#fff', padding: 10 } },
  scales: {
    y: { grid: { color: 'rgba(148,163,184,0.06)' }, border: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } },
    x: { grid: { display: false }, border: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } },
  },
}

// ── CHART 5: Top productos (horizontal bar) ───────────────────────────────────
const topProductsData = computed(() => {
  const tp = dashboardData.value?.topProducts
  if (!tp || tp.length === 0) return null
  const top5 = tp.slice(0, 5)
  return {
    labels: top5.map((p: any) => {
      const n: string = p.product?.name ?? p.name ?? ''
      return n.length > 22 ? n.substring(0, 22) + '…' : n
    }),
    datasets: [{
      label: 'Ingresos',
      data: top5.map((p: any) => Number(p.totalRevenue ?? p.revenue ?? 0)),
      backgroundColor: ['#0EA5E9','#10B981','#F59E0B','#8B5CF6','#EF4444'],
      borderRadius: 6,
    }],
  }
})

const horizontalBarOptions = {
  indexAxis: 'y' as const,
  responsive: true, maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { backgroundColor: '#1e293b', titleColor: '#94a3b8', bodyColor: '#fff', padding: 10,
      callbacks: { label: (ctx: any) => ` $${Number(ctx.raw).toLocaleString('es-MX', { maximumFractionDigits: 0 })}` } },
  },
  scales: {
    x: { grid: { color: 'rgba(148,163,184,0.06)' }, border: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 }, callback: (v: any) => `$${(v/1000).toFixed(0)}k` } },
    y: { grid: { display: false }, border: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } },
  },
}

// ── CHART 6: Ventas vs Compras (grouped bar) ──────────────────────────────────
const salesVsPurchasesData = computed(() => {
  const d = dashboardData.value
  if (!d) return null
  const months = Array.from({ length: 6 }, (_, i) => dayjs().subtract(5 - i, 'month').format('MMM YY'))
  const salesData = new Array(6).fill(0); salesData[5] = d.salesThisMonth?.total ?? 0
  const purchData = new Array(6).fill(0); purchData[5] = d.purchasesThisMonth?.total ?? 0
  return {
    labels: months,
    datasets: [
      { label: 'Ventas',  data: salesData, backgroundColor: '#10B981', borderRadius: 6, borderSkipped: false },
      { label: 'Compras', data: purchData, backgroundColor: '#F59E0B', borderRadius: 6, borderSkipped: false },
    ],
  }
})

const groupedBarOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { backgroundColor: '#1e293b', titleColor: '#94a3b8', bodyColor: '#fff', padding: 10,
      callbacks: { label: (ctx: any) => ` ${ctx.dataset.label}: $${Number(ctx.raw).toLocaleString('es-MX', { maximumFractionDigits: 0 })}` } },
  },
  scales: {
    y: { grid: { color: 'rgba(148,163,184,0.06)' }, border: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 }, callback: (v: any) => `$${(v/1000).toFixed(0)}k` } },
    x: { grid: { display: false }, border: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } },
  },
}

// ── RING CHARTS ───────────────────────────────────────────────────────────────
const ringOptions = { responsive: true, maintainAspectRatio: false, cutout: '78%', plugins: { legend: { display: false }, tooltip: { enabled: false } }, animation: { duration: 800 } }

const ringStockData = computed(() => ({
  datasets: [{ data: [ringValues.value.stockHealth, 100 - ringValues.value.stockHealth], backgroundColor: [ringValues.value.stockHealth >= 70 ? '#10B981' : ringValues.value.stockHealth >= 40 ? '#F59E0B' : '#EF4444', '#F0F4F8'], borderWidth: 0, hoverOffset: 0 }],
}))

const ringSalesData = computed(() => {
  const pct = Math.min(Math.round((kpis.value.salesCount / Math.max(kpis.value.salesCount + kpis.value.pendingSales, 1)) * 100), 100)
  return { datasets: [{ data: [pct, 100 - pct], backgroundColor: ['#0EA5E9', '#F0F4F8'], borderWidth: 0, hoverOffset: 0 }] }
})

const ringCoverageData = computed(() => ({
  datasets: [{ data: [ringValues.value.coverage, 100 - ringValues.value.coverage], backgroundColor: ['#8B5CF6', '#F0F4F8'], borderWidth: 0, hoverOffset: 0 }],
}))

const ringAlertData = computed(() => ({
  datasets: [{ data: [ringValues.value.alertPct, 100 - ringValues.value.alertPct], backgroundColor: [ringValues.value.alertPct > 20 ? '#EF4444' : '#F59E0B', '#F0F4F8'], borderWidth: 0, hoverOffset: 0 }],
}))

// ── Helpers ───────────────────────────────────────────────────────────────────
const movBg = (t: string) => ({ ENTRY: 'bg-emerald-500', EXIT: 'bg-red-500', ADJUSTMENT: 'bg-amber-400', TRANSFER: 'bg-sky-500', PRODUCTION_IN: 'bg-violet-500', PRODUCTION_OUT: 'bg-orange-500' }[t] ?? 'bg-slate-400')
const movLabel = (t: string) => ({ ENTRY: 'Entrada', EXIT: 'Salida', ADJUSTMENT: 'Ajuste', TRANSFER: 'Transferencia', PRODUCTION_IN: 'Entrada Prod.', PRODUCTION_OUT: 'Salida Prod.' }[t] ?? t)
const formatCurrency = (v: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(v ?? 0)
const formatDate = (d: string) => dayjs(d).fromNow()

// ── Fetch ─────────────────────────────────────────────────────────────────────
async function refresh() {
  loading.value = true
  try {
    const from  = dayjs().startOf('month').format('YYYY-MM-DD')
    const today = dayjs().format('YYYY-MM-DD')
    const [dashRes, lowRes, movRes, salesRes] = await Promise.all([
      reportsApi.dashboard(),
      productsApi.lowStock(),
      inventoryApi.movements({ limit: 8 }),
      reportsApi.sales({ from, to: today }),
    ])
    dashboardData.value   = dashRes.data
    lowStockItems.value   = lowRes.data
    recentMovements.value = movRes.data?.data ?? []
    salesReport.value     = salesRes.data
  } catch (e) { console.error(e) } finally { loading.value = false }
}

onMounted(() => {
  import('dayjs/plugin/relativeTime').then(m => dayjs.extend(m.default))
  refresh()
})
</script>
