<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Categorías</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Clasificación de productos</p>
      </div>
      <button class="btn-primary flex items-center gap-2" @click="openCreate">
        <PlusIcon class="w-4 h-4" />
        Nueva Categoría
      </button>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <div v-for="i in 8" :key="i" class="card animate-pulse">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700"></div>
          <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
        <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    </div>

    <!-- Category Cards -->
    <div v-else-if="categories.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <div
        v-for="cat in categories"
        :key="cat.id"
        class="card hover:shadow-md transition-shadow group"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3 mb-2">
            <div
              class="w-4 h-4 rounded-full flex-shrink-0 border-2 border-white shadow"
              :style="{ backgroundColor: cat.color || '#3b82f6' }"
            ></div>
            <h3 class="font-semibold text-gray-900 dark:text-white">{{ cat.name }}</h3>
          </div>
          <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button class="btn-ghost p-1.5 rounded" @click="openEdit(cat)">
              <PencilIcon class="w-3.5 h-3.5" />
            </button>
            <button class="btn-ghost p-1.5 rounded text-red-500" @click="confirmDelete(cat)">
              <TrashIcon class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <p v-if="cat.description" class="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
          {{ cat.description }}
        </p>
        <div class="pt-2 border-t border-gray-100 dark:border-gray-700">
          <span class="text-xs text-gray-500 dark:text-gray-400">
            {{ cat.productCount ?? 0 }} producto{{ (cat.productCount ?? 0) !== 1 ? 's' : '' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="card text-center py-16">
      <TagIcon class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
      <p class="text-gray-500">No hay categorías registradas</p>
      <button class="btn-primary mt-4" @click="openCreate">Crear primera categoría</button>
    </div>

    <!-- Create/Edit Modal -->
    <AppModal
      v-model="showModal"
      :title="editingId ? 'Editar Categoría' : 'Nueva Categoría'"
      size="sm"
    >
      <form @submit.prevent="submitForm" class="space-y-4">
        <div>
          <label class="label">Nombre *</label>
          <input v-model="form.name" class="input" required />
        </div>
        <div>
          <label class="label">Descripción</label>
          <textarea v-model="form.description" class="input" rows="3"></textarea>
        </div>
        <div>
          <label class="label">Color</label>
          <div class="flex items-center gap-3">
            <input v-model="form.color" type="color" class="w-10 h-10 rounded cursor-pointer border border-gray-300" />
            <span class="text-sm text-gray-500 dark:text-gray-400 font-mono">{{ form.color }}</span>
          </div>
        </div>
      </form>
      <template #footer>
        <button class="btn-secondary" @click="showModal = false">Cancelar</button>
        <button class="btn-primary" :disabled="saving" @click="submitForm">
          {{ saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear' }}
        </button>
      </template>
    </AppModal>

    <!-- Confirm Delete -->
    <ConfirmModal
      v-model="showConfirmDelete"
      title="Eliminar Categoría"
      :message="`¿Deseas eliminar la categoría '${deletingItem?.name}'? Los productos asociados quedarán sin categoría.`"
      confirm-text="Eliminar"
      variant="danger"
      @confirm="deleteCategory"
    />
  </div>
</template>

<script setup>
import { categoriesApi } from '@/services/api'
import { ref, reactive, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { PlusIcon, PencilIcon, TrashIcon, TagIcon } from '@heroicons/vue/24/outline'
import AppModal from '@/components/ui/AppModal.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'

const toast = useToast()
const loading = ref(false)
const saving = ref(false)
const categories = ref([])
const showModal = ref(false)
const showConfirmDelete = ref(false)
const editingId = ref(null)
const deletingItem = ref(null)

const form = reactive({ name: '', description: '', color: '#3b82f6' })

function openCreate() {
  editingId.value = null
  Object.assign(form, { name: '', description: '', color: '#3b82f6' })
  showModal.value = true
}

function openEdit(cat) {
  editingId.value = cat.id
  Object.assign(form, { name: cat.name, description: cat.description || '', color: cat.color || '#3b82f6' })
  showModal.value = true
}

function confirmDelete(cat) {
  deletingItem.value = cat
  showConfirmDelete.value = true
}

async function deleteCategory() {
  try {
    await categoriesApi.delete(deletingItem.value.id)
    toast.success('Categoría eliminada')
    fetchCategories()
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Error al eliminar categoría')
  }
}

async function submitForm() {
  if (!form.name) {
    toast.warning('El nombre es requerido')
    return
  }
  saving.value = true
  try {
    if (editingId.value) {
      await categoriesApi.update(editingId.value, form)
      toast.success('Categoría actualizada')
    } else {
      await categoriesApi.create(form)
      toast.success('Categoría creada')
    }
    showModal.value = false
    fetchCategories()
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Error al guardar')
  } finally {
    saving.value = false
  }
}

async function fetchCategories() {
  loading.value = true
  try {
    const res = await categoriesApi.list()
    categories.value = res.data
  } catch (err) {
    toast.error('Error al cargar categorías')
  } finally {
    loading.value = false
  }
}

onMounted(fetchCategories)
</script>
