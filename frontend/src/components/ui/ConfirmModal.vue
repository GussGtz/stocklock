<template>
  <TransitionRoot appear :show="modelValue" as="template">
    <Dialog as="div" class="relative z-50" @close="handleCancel">
      <TransitionChild
        as="template"
        enter="ease-out duration-200" enter-from="opacity-0" enter-to="opacity-100"
        leave="ease-in duration-150" leave-from="opacity-100" leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black/40 backdrop-blur-[2px]" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <TransitionChild
            as="template"
            enter="ease-out duration-200" enter-from="opacity-0 scale-95 translate-y-2" enter-to="opacity-100 scale-100 translate-y-0"
            leave="ease-in duration-150" leave-from="opacity-100 scale-100 translate-y-0" leave-to="opacity-0 scale-95 translate-y-2"
          >
            <DialogPanel class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-modal w-full max-w-sm overflow-hidden">

              <!-- Top accent bar -->
              <div :class="['h-1 w-full', variant === 'danger' ? 'bg-red-500' : 'bg-amber-500']" />

              <!-- Content -->
              <div class="p-6">
                <!-- Icon + Title -->
                <div class="flex items-start gap-4 mb-4">
                  <div
                    class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                    :class="variant === 'danger' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-50 dark:bg-amber-900/30'"
                  >
                    <ExclamationTriangleIcon
                      class="w-5 h-5"
                      :class="variant === 'danger' ? 'text-red-600' : 'text-amber-600'"
                    />
                  </div>
                  <div class="flex-1 min-w-0">
                    <DialogTitle class="text-base font-semibold text-slate-900 dark:text-white">
                      {{ title }}
                    </DialogTitle>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                      {{ message }}
                    </p>
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex items-center justify-end gap-3 mt-6">
                  <button type="button" class="btn-secondary" @click="handleCancel">
                    Cancelar
                  </button>
                  <button
                    type="button"
                    :class="variant === 'danger' ? 'btn-danger' : 'btn-warning'"
                    @click="handleConfirm"
                  >
                    {{ confirmText }}
                  </button>
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup>
import { Dialog, DialogPanel, DialogTitle, TransitionRoot, TransitionChild } from '@headlessui/vue'
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  modelValue:  { type: Boolean, required: true },
  title:       { type: String,  default: '¿Estás seguro?' },
  message:     { type: String,  default: 'Esta acción no se puede deshacer.' },
  confirmText: { type: String,  default: 'Confirmar' },
  variant:     { type: String,  default: 'danger', validator: (v) => ['danger','warning'].includes(v) },
})

const emit = defineEmits(['confirm', 'cancel', 'update:modelValue'])

function handleConfirm() {
  emit('confirm')
  emit('update:modelValue', false)
}

function handleCancel() {
  emit('cancel')
  emit('update:modelValue', false)
}
</script>
