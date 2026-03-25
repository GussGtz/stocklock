<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Almacenes</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestión de ubicaciones de inventario</p>
      </div>
      <button class="btn-primary flex items-center gap-2" @click="openCreate">
        <PlusIcon class="w-4 h-4" />
        Nuevo Almacén
      </button>
    </div>

    <!-- Loading skeleton cards -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <div v-for="i in 6" :key="i" class="card animate-pulse">
        <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
        <div class="space-y-2">
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    </div>

    <!-- Warehouse Cards -->
    <div v-else-if="warehouses.length > 0" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <div
        v-for="wh in warehouses"
        :key="wh.id"
        class="card hover:shadow-md transition-shadow"
      >
        <div class="flex items-start justify-between mb-3">
          <div>
            <div class="flex items-center gap-2">
              <h3 class="font-semibold text-gray-900 dark:text-white">{{ wh.name }}</h3>
              <span v-if="wh.isDefault" class="badge-blue text-xs">Default</span>
            </div>
            <span class="text-xs text-gray-400 font-mono">{{ wh.code }}</span>
          </div>
          <BuildingStorefrontIcon class="w-8 h-8 text-blue-400" />
        </div>

        <div class="space-y-1.5 text-sm text-gray-600 dark:text-gray-300 mb-4">
          <div v-if="wh.address" class="flex items-center gap-1.5">
            <MapPinIcon class="w-3.5 h-3.5 text-gray-400" />
            {{ wh.address }}
          </div>
          <div v-if="wh.city" class="flex items-center gap-1.5">
            <GlobeAmericasIcon class="w-3.5 h-3.5 text-gray-400" />
            {{ wh.city }}{{ wh.state ? ', ' + wh.state : '' }}
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 mb-4">
          <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
            <p class="text-xs text-gray-500 dark:text-gray-400">Productos</p>
            <p class="text-lg font-bold text-gray-900 dark:text-white">{{ wh.productCount ?? 0 }}</p>
          </div>
          <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
            <p class="text-xs text-gray-500 dark:text-gray-400">Valor Total</p>
            <p class="text-sm font-bold text-green-600 dark:text-green-400">{{ formatCurrency(wh.totalValue ?? 0) }}</p>
          </div>
        </div>

        <div class="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
          <button class="btn-ghost text-xs px-2 py-1 flex-1" @click="openEdit(wh)">
            <PencilIcon class="w-3.5 h-3.5 inline mr-1" />Editar
          </button>
          <button
            v-if="!wh.isDefault"
            class="btn-ghost text-xs px-2 py-1 flex-1"
            @click="setDefault(wh)"
          >
            <StarIcon class="w-3.5 h-3.5 inline mr-1" />Default
          </button>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="card text-center py-16">
      <BuildingStorefrontIcon class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
      <p class="text-gray-500">No hay almacenes registrados</p>
      <button class="btn-primary mt-4" @click="openCreate">Crear primer almacén</button>
    </div>

    <!-- Create/Edit Modal -->
    <AppModal
      v-model="showModal"
      :title="editingId ? 'Editar Almacén' : 'Nuevo Almacén'"
      size="md"
    >
      <form @submit.prevent="submitForm" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Nombre *</label>
            <input v-model="form.name" class="input" required />
          </div>
          <div>
            <label class="label">Código *</label>
            <input v-model="form.code" class="input" required />
          </div>
        </div>
        <div>
          <label class="label">Dirección</label>
          <input v-model="form.address" class="input" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Ciudad</label>
            <input v-model="form.city" class="input" />
          </div>
          <div>
            <label class="label">Estado</label>
            <input v-model="form.state" class="input" />
          </div>
        </div>
        <div>
          <label class="label">Descripción</label>
          <textarea v-model="form.description" class="input" rows="2"></textarea>
        </div>
      </form>
      <template #footer>
        <button class="btn-secondary" @click="showModal = false">Cancelar</button>
        <button class="btn-primary" :disabled="saving" @click="submitForm">
          {{ saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear' }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { warehousesApi } from '@/services/api'
import { ref, reactive, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import {
  PlusIcon,
  PencilIcon,
  StarIcon,
  BuildingStorefrontIcon,
  MapPinIcon,
  GlobeAmericasIcon,
} from '@heroicons/vue/24/outline'
import AppModal from '@/components/ui/AppModal.vue'

const toast = useToast()
const loading = ref(false)
const saving = ref(false)
const warehouses = ref([])
const showModal = ref(false)
const editingId = ref(null)

const form = reactive({
  name: '',
  code: '',
  address: '',
  city: '',
  state: '',
  description: '',
})

function openCreate() {
  editingId.value = null
  Object.assign(form, { name: '', code: '', address: '', city: '', state: '', description: '' })
  showModal.value = true
}

function openEdit(wh) {
  editingId.value = wh.id
  Object.assign(form, {
    name: wh.name,
    code: wh.code,
    address: wh.address || '',
    city: wh.city || '',
    state: wh.state || '',
    description: wh.description || '',
  })
  showModal.value = true
}

async function setDefault(wh) {
  try {
    await warehousesApi.setDefault(wh.id)
    toast.success(`${wh.name} establecido como almacén predeterminado`)
    fetchWarehouses()
  } catch (err) {
    toast.error('Error al establecer almacén predeterminado')
  }
}

async function submitForm() {
  if (!form.name || !form.code) {
    toast.warning('Nombre y código son requeridos')
    return
  }
  saving.value = true
  try {
    if (editingId.value) {
      await warehousesApi.update(editingId.value, form)
      toast.success('Almacén actualizado')
    } else {
      await warehousesApi.create(form)
      toast.success('Almacén creado')
    }
    showModal.value = false
    fetchWarehouses()
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Error al guardar')
  } finally {
    saving.value = false
  }
}

function formatCurrency(v) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v)
}

async function fetchWarehouses() {
  loading.value = true
  try {
    const res = await warehousesApi.list()
    warehouses.value = res.data
  } catch (err) {
    toast.error('Error al cargar almacenes')
  } finally {
    loading.value = false
  }
}

onMounted(fetchWarehouses)
</script>
