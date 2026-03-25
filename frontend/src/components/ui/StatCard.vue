<template>
  <div class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700/80 rounded-xl shadow-card p-5 flex items-start gap-4 transition-all duration-200 hover:shadow-soft">

    <!-- Icon -->
    <div :class="['stat-icon', iconBg]">
      <CubeIcon            v-if="icon === 'cube'"     :class="['w-5 h-5', iconColor]" />
      <CurrencyDollarIcon  v-else-if="icon === 'currency'" :class="['w-5 h-5', iconColor]" />
      <ArrowsRightLeftIcon v-else-if="icon === 'arrows'"   :class="['w-5 h-5', iconColor]" />
      <BellAlertIcon       v-else-if="icon === 'bell'"     :class="['w-5 h-5', iconColor]" />
      <ChartBarIcon        v-else-if="icon === 'chart'"    :class="['w-5 h-5', iconColor]" />
      <UsersIcon           v-else-if="icon === 'users'"    :class="['w-5 h-5', iconColor]" />
      <ShoppingCartIcon    v-else-if="icon === 'cart'"     :class="['w-5 h-5', iconColor]" />
      <ChartBarIcon        v-else                          :class="['w-5 h-5', iconColor]" />
    </div>

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <template v-if="loading">
        <div class="skeleton h-3 w-24 rounded mb-2" />
        <div class="skeleton h-7 w-16 rounded" />
      </template>
      <template v-else>
        <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider truncate">
          {{ label }}
        </p>
        <p class="text-2xl font-bold text-slate-900 dark:text-white mt-1 leading-none">
          {{ value }}
        </p>
        <div v-if="change !== undefined" class="flex items-center gap-1 mt-1.5">
          <ArrowTrendingUpIcon   v-if="change >= 0" class="w-3.5 h-3.5 text-green-500" />
          <ArrowTrendingDownIcon v-else              class="w-3.5 h-3.5 text-red-500" />
          <span :class="['text-xs font-medium', change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400']">
            {{ Math.abs(change) }}% vs ayer
          </span>
        </div>
        <div v-if="subtitle" class="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {{ subtitle }}
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  CubeIcon, CurrencyDollarIcon, ArrowsRightLeftIcon, BellAlertIcon,
  ChartBarIcon, UsersIcon, ShoppingCartIcon,
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
