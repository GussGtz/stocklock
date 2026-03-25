<template>
  <div class="space-y-3">
    <!-- Table Container -->
    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              :class="col.sortable ? 'cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors' : ''"
              :style="col.width ? { width: col.width } : {}"
              @click="col.sortable ? handleSort(col.key) : null"
            >
              <div class="flex items-center gap-1.5">
                <span>{{ col.label }}</span>
                <span v-if="col.sortable" class="text-gray-400">
                  <ChevronUpIcon
                    v-if="sortKey === col.key && sortDir === 'asc'"
                    class="w-3.5 h-3.5 text-primary-500"
                  />
                  <ChevronDownIcon
                    v-else-if="sortKey === col.key && sortDir === 'desc'"
                    class="w-3.5 h-3.5 text-primary-500"
                  />
                  <ChevronUpDownIcon v-else class="w-3.5 h-3.5 opacity-30" />
                </span>
              </div>
            </th>
          </tr>
        </thead>

        <tbody>
          <!-- Skeleton Loading -->
          <template v-if="loading">
            <tr v-for="i in skeletonRows" :key="'sk-' + i" class="border-t border-gray-100 dark:border-slate-700/60">
              <td v-for="col in columns" :key="col.key" class="px-4 py-3.5">
                <div class="h-4 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" :style="{ width: skeletonWidths[i % skeletonWidths.length] }"></div>
              </td>
            </tr>
          </template>

          <!-- Empty State -->
          <tr v-else-if="!data || data.length === 0">
            <td :colspan="columns.length" class="text-center py-16">
              <div class="flex flex-col items-center gap-3 text-gray-400 dark:text-gray-500">
                <div class="w-14 h-14 rounded-full bg-gray-100 dark:bg-slate-700/50 flex items-center justify-center">
                  <InboxIcon class="w-7 h-7" />
                </div>
                <div>
                  <p class="text-sm font-semibold text-gray-500 dark:text-gray-400">Sin resultados</p>
                  <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">No hay datos para mostrar</p>
                </div>
              </div>
            </td>
          </tr>

          <!-- Data Rows -->
          <template v-else>
            <tr v-for="(row, idx) in data" :key="row.id ?? idx">
              <td v-for="col in columns" :key="col.key">
                <slot :name="'cell-' + col.key" :row="row" :value="row[col.key]">
                  {{ row[col.key] ?? '—' }}
                </slot>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div
      v-if="pagination && pagination.total > 0"
      class="flex items-center justify-between px-1"
    >
      <!-- Info -->
      <p class="text-sm text-gray-500 dark:text-gray-400">
        <span class="font-medium text-slate-700 dark:text-gray-300">{{ pageStart }}–{{ pageEnd }}</span>
        de <span class="font-medium text-slate-700 dark:text-gray-300">{{ pagination.total }}</span> registros
      </p>

      <!-- Pages -->
      <div class="flex items-center gap-1">
        <!-- Prev -->
        <button
          class="btn-ghost btn-sm px-2 py-1.5 rounded-md disabled:opacity-30"
          :disabled="pagination.page <= 1"
          @click="$emit('page-change', pagination.page - 1)"
        >
          <ChevronLeftIcon class="w-4 h-4" />
        </button>

        <!-- Page numbers -->
        <template v-for="p in visiblePages" :key="p">
          <span
            v-if="p === '...'"
            class="px-2 py-1 text-sm text-gray-400"
          >…</span>
          <button
            v-else
            class="px-3 py-1 text-sm rounded-md font-medium transition-colors"
            :class="p === pagination.page
              ? 'bg-primary-600 text-white shadow-sm'
              : 'btn-ghost'"
            @click="$emit('page-change', p)"
          >
            {{ p }}
          </button>
        </template>

        <!-- Next -->
        <button
          class="btn-ghost btn-sm px-2 py-1.5 rounded-md disabled:opacity-30"
          :disabled="pagination.page >= totalPages"
          @click="$emit('page-change', pagination.page + 1)"
        >
          <ChevronRightIcon class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import {
  ChevronUpIcon, ChevronDownIcon, ChevronUpDownIcon,
  ChevronLeftIcon, ChevronRightIcon, InboxIcon,
} from '@heroicons/vue/24/outline'

const props = defineProps({
  columns:     { type: Array,   required: true },
  data:        { type: Array,   default: () => [] },
  loading:     { type: Boolean, default: false },
  pagination:  { type: Object,  default: null },
  skeletonRows:{ type: Number,  default: 8 },
})

const emit = defineEmits(['page-change', 'sort-change'])

const sortKey = ref(null)
const sortDir = ref('asc')

const skeletonWidths = ['45%', '65%', '55%', '80%', '40%', '70%']

function handleSort(key) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = 'asc'
  }
  emit('sort-change', { key: sortKey.value, dir: sortDir.value })
}

const totalPages = computed(() =>
  props.pagination ? Math.ceil(props.pagination.total / props.pagination.limit) : 1
)

const pageStart = computed(() =>
  props.pagination ? (props.pagination.page - 1) * props.pagination.limit + 1 : 0
)

const pageEnd = computed(() =>
  props.pagination ? Math.min(props.pagination.page * props.pagination.limit, props.pagination.total) : 0
)

const visiblePages = computed(() => {
  const total   = totalPages.value
  const current = props.pagination?.page || 1
  const pages   = []

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
    return pages
  }

  pages.push(1)
  if (current > 3)         pages.push('...')
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i)
  if (current < total - 2) pages.push('...')
  pages.push(total)

  return pages
})
</script>
