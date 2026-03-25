<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Clientes</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestión de clientes y crédito</p>
      </div>
      <button class="btn-primary flex items-center gap-2" @click="openCreate">
        <PlusIcon class="w-4 h-4" />
        Nuevo Cliente
      </button>
    </div>

    <!-- Filters -->
    <div class="card">
      <div class="flex flex-wrap gap-3">
        <div class="flex-1 min-w-48">
          <SearchInput v-model="filters.search" placeholder="Buscar por nombre, RFC o código..." />
        </div>
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
        :data="customers"
        :loading="loading"
        :pagination="pagination"
        @page-change="onPageChange"
      >
        <template #cell-isActive="{ value }">
          <span :class="value ? 'badge-green' : 'badge-gray'">{{ value ? 'Activo' : 'Inactivo' }}</span>
        </template>
        <template #cell-creditUsage="{ row }">
          <div class="w-24">
            <div class="flex justify-between text-xs mb-0.5">
              <span>{{ formatCurrency(row.creditUsed || 0) }}</span>
              <span class="text-gray-400">{{ creditPercent(row) }}%</span>
            </div>
            <div class="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all"
                :class="creditPercent(row) >= 90 ? 'bg-red-500' : creditPercent(row) >= 70 ? 'bg-amber-400' : 'bg-green-500'"
                :style="{ width: creditPercent(row) + '%' }"
              ></div>
            </div>
          </div>
        </template>
        <template #cell-creditLimit="{ value }">{{ formatCurrency(value) }}</template>
        <template #cell-paymentTerms="{ value }">
          <span class="badge-blue">{{ value ?? 0 }} días</span>
        </template>
        <template #cell-actions="{ row }">
          <div class="flex gap-2">
            <button class="btn-ghost text-xs px-2 py-1" @click="openEdit(row)">
              <PencilIcon class="w-3.5 h-3.5 inline" />
            </button>
            <button class="btn-ghost text-xs px-2 py-1 text-red-500" @click="confirmDeactivate(row)">
              <TrashIcon class="w-3.5 h-3.5 inline" />
            </button>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Create/Edit Modal -->
    <AppModal
      v-model="showModal"
      :title="editingId ? 'Editar Cliente' : 'Nuevo Cliente'"
      size="lg"
    >
      <form @submit.prevent="submitForm" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Código *</label>
            <input v-model="form.code" class="input" required />
          </div>
          <div>
            <label class="label">Nombre / Razón Social *</label>
            <input v-model="form.name" class="input" required />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">RFC</label>
            <input v-model="form.rfc" class="input" />
          </div>
          <div>
            <label class="label">Contacto</label>
            <input v-model="form.contactName" class="input" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Email</label>
            <input v-model="form.email" type="email" class="input" />
          </div>
          <div>
            <label class="label">Teléfono</label>
            <input v-model="form.phone" class="input" />
          </div>
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
          <label class="label">Dirección</label>
          <input v-model="form.address" class="input" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Límite de Crédito</label>
            <input v-model.number="form.creditLimit" type="number" min="0" step="0.01" class="input" />
          </div>
          <div>
            <label class="label">Términos de Pago (días)</label>
            <input v-model.number="form.paymentTerms" type="number" min="0" class="input" />
          </div>
        </div>
        <div>
          <label class="label">Notas</label>
          <textarea v-model="form.notes" class="input" rows="2"></textarea>
        </div>
      </form>
      <template #footer>
        <button class="btn-secondary" @click="showModal = false">Cancelar</button>
        <button class="btn-primary" :disabled="saving" @click="submitForm">
          {{ saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear' }}
        </button>
      </template>
    </AppModal>

    <!-- Confirm Deactivate -->
    <ConfirmModal
      v-model="showConfirmDelete"
      title="Desactivar Cliente"
      :message="`¿Deseas desactivar al cliente '${deletingItem?.name}'?`"
      confirm-text="Desactivar"
      variant="warning"
      @confirm="deactivateCustomer"
    />
  </div>
</template>

<script setup>
import { customersApi } from '@/services/api'
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
const customers = ref([])
const showModal = ref(false)
const showConfirmDelete = ref(false)
const editingId = ref(null)
const deletingItem = ref(null)

const pagination = reactive({ page: 1, limit: 20, total: 0 })
const filters = reactive({ search: '', isActive: '' })

const defaultForm = () => ({
  code: '', name: '', rfc: '', contactName: '', email: '', phone: '',
  city: '', state: '', address: '', creditLimit: 0, paymentTerms: 30, notes: '',
})
const form = reactive(defaultForm())

const columns = [
  { key: 'code', label: 'Código', sortable: true },
  { key: 'name', label: 'Nombre', sortable: true },
  { key: 'rfc', label: 'RFC' },
  { key: 'city', label: 'Ciudad' },
  { key: 'phone', label: 'Teléfono' },
  { key: 'creditLimit', label: 'Límite Crédito' },
  { key: 'creditUsage', label: 'Uso de Crédito' },
  { key: 'paymentTerms', label: 'Pago' },
  { key: 'isActive', label: 'Estado' },
  { key: 'actions', label: 'Acciones' },
]

function creditPercent(row) {
  if (!row.creditLimit || row.creditLimit === 0) return 0
  return Math.min(100, Math.round(((row.creditUsed || 0) / row.creditLimit) * 100))
}

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

function confirmDeactivate(row) {
  deletingItem.value = row
  showConfirmDelete.value = true
}

async function deactivateCustomer() {
  try {
    await customersApi.update(deletingItem.value.id, { isActive: false })
    toast.success('Cliente desactivado')
    fetchCustomers()
  } catch (err) {
    toast.error('Error al desactivar cliente')
  }
}

async function submitForm() {
  if (!form.code || !form.name) {
    toast.warning('Código y nombre son requeridos')
    return
  }
  saving.value = true
  try {
    if (editingId.value) {
      await customersApi.update(editingId.value, form)
      toast.success('Cliente actualizado')
    } else {
      await customersApi.create(form)
      toast.success('Cliente creado')
    }
    showModal.value = false
    fetchCustomers()
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Error al guardar')
  } finally {
    saving.value = false
  }
}

async function fetchCustomers() {
  loading.value = true
  try {
    const _cp = { page: pagination.page, limit: pagination.limit }
    if (filters.search) _cp.search = filters.search
    if (filters.isActive !== '' && filters.isActive !== undefined) _cp.isActive = filters.isActive
    const res = await customersApi.list(_cp)
    const rawCust = res.data.data || res.data.items || (Array.isArray(res.data) ? res.data : [])
    customers.value = rawCust
    if ((res.data.meta?.total ?? res.data.total) !== undefined) pagination.total = res.data.meta?.total ?? res.data.total
  } catch (err) {
    toast.error('Error al cargar clientes')
  } finally {
    loading.value = false
  }
}

function onPageChange(p) { pagination.page = p; fetchCustomers() }
watch(filters, () => { pagination.page = 1; fetchCustomers() })
onMounted(fetchCustomers)
</script>
