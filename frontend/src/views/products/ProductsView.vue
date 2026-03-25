<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Productos</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Catálogo de productos y materiales</p>
      </div>
      <button class="btn-primary flex items-center gap-2" @click="openCreate">
        <PlusIcon class="w-4 h-4" />
        Nuevo Producto
      </button>
    </div>

    <!-- Filters -->
    <div class="card">
      <div class="flex flex-wrap gap-3">
        <div class="flex-1 min-w-48">
          <SearchInput v-model="filters.search" placeholder="Buscar por nombre o código..." />
        </div>
        <select v-model="filters.categoryId" class="input w-48">
          <option value="">Todas las categorías</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
        </select>
        <select v-model="filters.isActive" class="input w-36">
          <option value="">Todos</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
      </div>
    </div>

    <!-- Table -->
    <div class="card p-0">
      <DataTable
        :columns="columns"
        :data="products"
        :loading="loading"
        :pagination="pagination"
        @page-change="onPageChange"
        @sort-change="onSortChange"
      >
        <template #cell-isActive="{ value }">
          <span :class="value ? 'badge-green' : 'badge-gray'">{{ value ? 'Activo' : 'Inactivo' }}</span>
        </template>
        <template #cell-costPrice="{ value }">{{ formatCurrency(value) }}</template>
        <template #cell-salePrice="{ value }">{{ formatCurrency(value) }}</template>
        <template #cell-actions="{ row }">
          <div class="flex gap-2">
            <button class="btn-ghost text-xs px-2 py-1" @click="openEdit(row)">
              <PencilIcon class="w-3.5 h-3.5 inline" />
            </button>
            <button class="btn-ghost text-xs px-2 py-1 text-red-500" @click="confirmDelete(row)">
              <TrashIcon class="w-3.5 h-3.5 inline" />
            </button>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Create/Edit Modal -->
    <AppModal
      v-model="showModal"
      :title="editingId ? 'Editar Producto' : 'Nuevo Producto'"
      size="xl"
    >
      <form @submit.prevent="submitForm" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Código *</label>
            <input v-model="form.code" class="input" required />
          </div>
          <div>
            <label class="label">Nombre *</label>
            <input v-model="form.name" class="input" required />
          </div>
        </div>
        <div>
          <label class="label">Descripción</label>
          <textarea v-model="form.description" class="input" rows="2"></textarea>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Categoría *</label>
            <select v-model="form.categoryId" class="input" required>
              <option value="">Seleccionar...</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>
          <div>
            <label class="label">Unidad *</label>
            <select v-model="form.unit" class="input" required>
              <option value="KG">KG</option>
              <option value="TON">Tonelada</option>
              <option value="METER">Metro</option>
              <option value="PIECE">Pieza</option>
              <option value="SHEET">Lámina</option>
              <option value="BAR">Barra</option>
              <option value="TUBE">Tubo</option>
              <option value="PROFILE">Perfil</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="label">Peso (kg)</label>
            <input v-model.number="form.weight" type="number" step="0.001" class="input" />
          </div>
          <div>
            <label class="label">Espesor (mm)</label>
            <input v-model.number="form.thickness" type="number" step="0.001" class="input" />
          </div>
          <div>
            <label class="label">Ancho (mm)</label>
            <input v-model.number="form.width" type="number" step="0.001" class="input" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Longitud (mm)</label>
            <input v-model.number="form.length" type="number" step="0.001" class="input" />
          </div>
          <div>
            <label class="label">Serie de Aleación</label>
            <select v-model="form.seriesId" class="input">
              <option value="">Sin serie</option>
              <option v-for="s in seriesOptions" :key="s.id" :value="s.id">{{ s.code }} — {{ s.name }}</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Aleación específica</label>
            <input v-model="form.alloyType" class="input" placeholder="Ej. 6061, 6063, 7075..." />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Temple</label>
            <input v-model="form.temper" class="input" placeholder="Ej. T6" />
          </div>
          <div class="flex items-center gap-3 pt-5">
            <input id="isAluminum" v-model="form.isAluminum" type="checkbox" class="w-4 h-4 rounded" />
            <label for="isAluminum" class="label mb-0">Es aluminio</label>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Precio de Costo *</label>
            <input v-model.number="form.costPrice" type="number" step="0.01" min="0" class="input" required />
          </div>
          <div>
            <label class="label">Precio de Venta *</label>
            <input v-model.number="form.salePrice" type="number" step="0.01" min="0" class="input" required />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Stock Mínimo</label>
            <input v-model.number="form.minStock" type="number" min="0" class="input" />
          </div>
          <div>
            <label class="label">Stock Máximo</label>
            <input v-model.number="form.maxStock" type="number" min="0" class="input" />
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
      title="Eliminar Producto"
      :message="`¿Deseas desactivar el producto '${deletingItem?.name}'? Esto no eliminará los datos históricos.`"
      confirm-text="Desactivar"
      variant="danger"
      @confirm="deleteProduct"
    />
  </div>
</template>

<script setup>
import { productsApi, categoriesApi, seriesApi } from '@/services/api'
import { ref, reactive, watch, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/vue/24/outline'
import DataTable from '@/components/ui/DataTable.vue'
import AppModal from '@/components/ui/AppModal.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'

const toast = useToast()
const loading = ref(false)
const saving = ref(false)
const products = ref([])
const categories = ref([])
const seriesOptions = ref([])
const showModal = ref(false)
const showConfirmDelete = ref(false)
const editingId = ref(null)
const deletingItem = ref(null)

const pagination = reactive({ page: 1, limit: 20, total: 0 })
const filters = reactive({ search: '', categoryId: '', isActive: '' })

const defaultForm = () => ({
  code: '', name: '', description: '', categoryId: '', unit: 'PIECE',
  weight: null, thickness: null, width: null, length: null,
  alloyType: '', temper: '', isAluminum: false,
  costPrice: 0, salePrice: 0, minStock: 0, maxStock: null,
  seriesId: null,
})

const form = reactive(defaultForm())

const columns = [
  { key: 'code', label: 'Código', sortable: true },
  { key: 'name', label: 'Nombre', sortable: true },
  { key: 'categoryName', label: 'Categoría' },
  { key: 'unit', label: 'Unidad' },
  { key: 'stock', label: 'Stock', sortable: true },
  { key: 'minStock', label: 'Mín' },
  { key: 'costPrice', label: 'Costo' },
  { key: 'salePrice', label: 'Precio Venta' },
  { key: 'isActive', label: 'Estado' },
  { key: 'actions', label: 'Acciones' },
]

function formatCurrency(v) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v || 0)
}

function openCreate() {
  editingId.value = null
  Object.assign(form, defaultForm())
  showModal.value = true
}

function openEdit(row) {
  editingId.value = row.id
  Object.assign(form, { ...defaultForm(), ...row })
  showModal.value = true
}

function confirmDelete(row) {
  deletingItem.value = row
  showConfirmDelete.value = true
}

async function deleteProduct() {
  try {
    await productsApi.delete(deletingItem.value.id)
    toast.success('Producto desactivado')
    fetchProducts()
  } catch (err) {
    toast.error('Error al eliminar producto')
  }
}

async function submitForm() {
  if (!form.code || !form.name || !form.categoryId || !form.unit) {
    toast.warning('Completa los campos requeridos')
    return
  }
  saving.value = true
  try {
    if (editingId.value) {
      await productsApi.update(editingId.value, form)
      toast.success('Producto actualizado')
    } else {
      await productsApi.create(form)
      toast.success('Producto creado')
    }
    showModal.value = false
    fetchProducts()
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Error al guardar')
  } finally {
    saving.value = false
  }
}

async function fetchProducts() {
  loading.value = true
  try {
    const params = { page: pagination.page, limit: pagination.limit }
    if (filters.search) params.search = filters.search
    if (filters.categoryId) params.categoryId = filters.categoryId
    if (filters.isActive !== '') params.isActive = filters.isActive
    const res = await productsApi.list(params)
    const raw = res.data.data || res.data.items || (Array.isArray(res.data) ? res.data : [])
    console.log('[Products] raw count:', raw.length, 'first:', raw[0]?.code)
    products.value = raw.map(p => ({ ...p, categoryName: p.category?.name ?? '—', stock: p.currentStock ?? 0 }))
    console.log('[Products] products.value length:', products.value.length)
    if (res.data.meta?.total !== undefined) pagination.total = res.data.meta.total
  } catch (err) {
    console.error('[Products] fetch error:', err)
    toast.error('Error al cargar productos')
  } finally {
    loading.value = false
  }
}

function onPageChange(p) { pagination.page = p; fetchProducts() }
function onSortChange() { fetchProducts() }

watch(filters, () => { pagination.page = 1; fetchProducts() })

onMounted(async () => {
  const res = await categoriesApi.list()
  categories.value = res.data
  const sRes = await seriesApi.list()
  seriesOptions.value = Array.isArray(sRes.data) ? sRes.data.filter(s => s.isActive) : []
  fetchProducts()
})
</script>
