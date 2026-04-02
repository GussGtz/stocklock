<template>
  <div class="relative" ref="container">
    <!-- Input -->
    <input
      ref="inputEl"
      v-model="search"
      type="text"
      :class="['input text-sm pr-7', errorClass]"
      placeholder="Buscar por código o nombre..."
      autocomplete="off"
      @focus="onFocus"
      @input="open = true"
      @keydown.escape="close"
      @keydown.enter.prevent="selectHighlighted"
      @keydown.arrow-down.prevent="moveDown"
      @keydown.arrow-up.prevent="moveUp"
    />

    <!-- Selected pill (shown when closed and product chosen) -->
    <div
      v-if="selectedProduct && !open"
      class="absolute inset-0 flex items-center px-3 gap-2 pointer-events-none overflow-hidden"
    >
      <span class="font-mono text-xs text-slate-400 dark:text-slate-500 shrink-0">{{ selectedProduct.code }}</span>
      <span class="text-sm truncate text-slate-800 dark:text-slate-100">{{ selectedProduct.name }}</span>
    </div>

    <!-- Clear button -->
    <button
      v-if="selectedProduct"
      type="button"
      tabindex="-1"
      class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors"
      @click.stop="clear"
    >
      <XMarkIcon class="w-3.5 h-3.5" />
    </button>

    <!-- Dropdown list -->
    <Teleport to="body">
      <div
        v-if="open"
        :style="dropdownStyle"
        class="fixed z-[9999] bg-white dark:bg-slate-800 border border-[#E8EDF2] dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden"
      >
        <!-- No results -->
        <div v-if="filtered.length === 0" class="px-4 py-3 text-sm text-slate-400 text-center">
          Sin resultados{{ search ? ` para "${search}"` : '' }}
        </div>

        <!-- Results -->
        <div class="max-h-52 overflow-y-auto">
          <button
            v-for="(p, i) in filtered"
            :key="p.id"
            type="button"
            :class="[
              'w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors',
              i === highlighted
                ? 'bg-indigo-50 dark:bg-indigo-900/30'
                : 'hover:bg-slate-50 dark:hover:bg-slate-700/50',
            ]"
            @mousedown.prevent="select(p)"
          >
            <span class="font-mono text-xs text-slate-400 w-16 shrink-0">{{ p.code }}</span>
            <span class="text-sm text-slate-800 dark:text-slate-100 flex-1 truncate">{{ p.name }}</span>
            <span class="text-xs text-slate-400 shrink-0">{{ formatCurrency(p.salePrice) }}</span>
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{
  modelValue: string           // product id
  products:   any[]
  errorClass?: string
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', id: string): void
  (e: 'select', product: any): void
}>()

const container   = ref<HTMLElement | null>(null)
const inputEl     = ref<HTMLInputElement | null>(null)
const open        = ref(false)
const search      = ref('')
const highlighted = ref(-1)
const dropdownStyle = ref({ top: '0px', left: '0px', width: '260px' })

const selectedProduct = computed(() =>
  props.products.find(p => p.id === props.modelValue) ?? null
)

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return props.products.slice(0, 60)
  return props.products.filter(p =>
    p.name?.toLowerCase().includes(q) ||
    p.code?.toLowerCase().includes(q)
  ).slice(0, 60)
})

function formatCurrency(v: any) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(v) || 0)
}

function onFocus() {
  search.value = ''
  open.value = true
  highlighted.value = -1
  positionDropdown()
}

function positionDropdown() {
  nextTick(() => {
    const el = inputEl.value
    if (!el) return
    const rect = el.getBoundingClientRect()
    dropdownStyle.value = {
      top:   `${rect.bottom + window.scrollY + 4}px`,
      left:  `${rect.left  + window.scrollX}px`,
      width: `${Math.max(rect.width, 260)}px`,
    }
  })
}

function select(p: any) {
  emit('update:modelValue', p.id)
  emit('select', p)
  search.value = ''
  open.value = false
  highlighted.value = -1
}

function clear() {
  emit('update:modelValue', '')
  emit('select', null)
  search.value = ''
  open.value = false
}

function close() {
  open.value = false
  search.value = ''
  highlighted.value = -1
}

function moveDown() {
  if (!open.value) { open.value = true; return }
  highlighted.value = Math.min(highlighted.value + 1, filtered.value.length - 1)
}
function moveUp() {
  highlighted.value = Math.max(highlighted.value - 1, 0)
}
function selectHighlighted() {
  if (highlighted.value >= 0 && filtered.value[highlighted.value]) {
    select(filtered.value[highlighted.value])
  }
}

// Close on outside click
function onDocClick(e: MouseEvent) {
  if (!open.value) return
  const target = e.target as Node
  if (container.value && !container.value.contains(target)) {
    close()
  }
}

onMounted(() => document.addEventListener('mousedown', onDocClick))
onBeforeUnmount(() => document.removeEventListener('mousedown', onDocClick))

// Reposition on scroll/resize
watch(open, (v) => { if (v) positionDropdown() })
</script>
