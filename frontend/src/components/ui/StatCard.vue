<template>
  <div class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700/80 rounded-xl shadow-card p-4 flex flex-col gap-3 transition-all duration-200 hover:shadow-soft">

    <!-- Icon -->
    <div :class="['w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', iconBg]">
      <CubeIcon            v-if="icon === 'cube'"      :class="['w-4 h-4', iconColor]" />
      <CurrencyDollarIcon  v-else-if="icon === 'currency'" :class="['w-4 h-4', iconColor]" />
      <ArrowsRightLeftIcon v-else-if="icon === 'arrows'"   :class="['w-4 h-4', iconColor]" />
      <BellAlertIcon       v-else-if="icon === 'bell'"     :class="['w-4 h-4', iconColor]" />
      <ChartBarIcon        v-else-if="icon === 'chart'"    :class="['w-4 h-4', iconColor]" />
      <TruckIcon           v-else-if="icon === 'truck'"    :class="['w-4 h-4', iconColor]" />
      <UsersIcon           v-else-if="icon === 'users'"    :class="['w-4 h-4', iconColor]" />
      <ShoppingCartIcon    v-else-if="icon === 'cart'"     :class="['w-4 h-4', iconColor]" />
      <ChartBarIcon        v-else                          :class="['w-4 h-4', iconColor]" />
    </div>

    <!-- Content -->
    <div class="min-w-0">
      <template v-if="loading">
        <div class="skeleton h-3 w-20 rounded mb-2" />
        <div class="skeleton h-6 w-14 rounded" />
      </template>
      <template v-else>
        <p class="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide leading-tight">
          {{ label }}
        </p>
        <p class="text-xl font-bold text-slate-900 dark:text-white mt-1 leading-none">
          {{ value }}
        </p>
        <div v-if="change !== undefined" class="flex items-center gap-1 mt-1.5">
          <ArrowTrendingUpIcon   v-if="change >= 0" class="w-3 h-3 text-green-500" />
          <ArrowTrendingDownIcon v-else              class="w-3 h-3 text-red-500" />
          <span :class="['text-[11px] font-medium', change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400']">
            {{ Math.abs(change) }}%
          </span>
        </div>
        <div v-if="subtitle" class="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
          {{ subtitle }}
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  CubeIcon, CurrencyDollarIcon, ArrowsRightLeftIcon, BellAlertIcon,
  ChartBarIcon, UsersIcon, ShoppingCartIcon, TruckIcon,
  ArrowTrendingUpIcon, ArrowTrendingDownIcon,
} from '@heroicons/vue/24/outline'

defineProps<{
  label?:    string
  value?:    string | number
  subtitle?: string
  icon?:     string
  iconBg?:   string
  iconColor?: string
  change?:   number
  loading?:  boolean
}>()
</script>
