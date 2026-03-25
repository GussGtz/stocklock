<template>
  <div class="relative">
    <MagnifyingGlassIcon
      class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
    />
    <input
      type="text"
      class="input pl-9"
      :class="modelValue ? 'pr-9' : 'pr-4'"
      :placeholder="placeholder"
      :value="modelValue"
      @input="handleInput"
      @keydown.escape="clear"
    />
    <Transition name="clear-fade">
      <button
        v-if="modelValue"
        type="button"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        @click="clear"
        tabindex="-1"
      >
        <XMarkIcon class="w-4 h-4" />
      </button>
    </Transition>
  </div>
</template>

<script setup>
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  modelValue:  { type: String, default: '' },
  placeholder: { type: String, default: 'Buscar...' },
  debounce:    { type: Number, default: 300 },
})

const emit = defineEmits(['update:modelValue'])

let debounceTimer = null

function handleInput(e) {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    emit('update:modelValue', e.target.value)
  }, props.debounce)
}

function clear() {
  clearTimeout(debounceTimer)
  emit('update:modelValue', '')
}
</script>

<style scoped>
.clear-fade-enter-active, .clear-fade-leave-active { transition: opacity 0.15s; }
.clear-fade-enter-from, .clear-fade-leave-to { opacity: 0; }
</style>
