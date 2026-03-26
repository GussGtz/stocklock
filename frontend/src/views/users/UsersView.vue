<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Usuarios</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestión de usuarios del sistema</p>
      </div>
      <button class="btn-primary flex items-center gap-2" @click="openCreate">
        <PlusIcon class="w-4 h-4" />
        Nuevo Usuario
      </button>
    </div>

    <!-- Filters -->
    <div class="card">
      <div class="flex flex-wrap gap-3">
        <div class="flex-1 min-w-48">
          <SearchInput v-model="filters.search" placeholder="Buscar por nombre o email..." />
        </div>
        <select v-model="filters.role" class="input w-40">
          <option value="">Todos los roles</option>
          <option value="ADMIN">Admin</option>
          <option value="MANAGER">Gerente</option>
          <option value="WAREHOUSE">Almacén</option>
          <option value="SALES">Ventas</option>
          <option value="VIEWER">Visualizador</option>
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
        :data="users"
        :loading="loading"
        :pagination="pagination"
        @page-change="onPageChange"
      >
        <template #cell-name="{ row }">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {{ initials(row) }}
            </div>
            <div>
              <p class="font-medium text-gray-900 dark:text-white text-sm">{{ row.firstName }} {{ row.lastName }}</p>
              <p class="text-xs text-gray-400">{{ row.email }}</p>
            </div>
          </div>
        </template>
        <template #cell-role="{ value }">
          <span :class="roleBadge(value)">{{ roleLabel(value) }}</span>
        </template>
        <template #cell-isActive="{ value }">
          <span :class="value ? 'badge-green' : 'badge-gray'">{{ value ? 'Activo' : 'Inactivo' }}</span>
        </template>
        <template #cell-lastLogin="{ value }">
          <span class="text-xs text-gray-500 dark:text-gray-400">{{ value ? formatDate(value) : 'Nunca' }}</span>
        </template>
        <template #cell-actions="{ row }">
          <div class="flex gap-1">
            <button class="btn-ghost text-xs px-2 py-1" @click="openEdit(row)">
              <PencilIcon class="w-3.5 h-3.5" />
            </button>
            <button
              class="btn-ghost text-xs px-2 py-1"
              :class="row.isActive ? 'text-amber-500' : 'text-green-500'"
              @click="toggleActive(row)"
            >
              <component :is="row.isActive ? PauseCircleIcon : PlayCircleIcon" class="w-3.5 h-3.5" />
            </button>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Create Modal -->
    <AppModal v-model="showCreateModal" title="Nuevo Usuario" size="md">
      <form @submit.prevent="submitCreate" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Nombre *</label>
            <input v-model="createForm.firstName" class="input" required />
          </div>
          <div>
            <label class="label">Apellido *</label>
            <input v-model="createForm.lastName" class="input" required />
          </div>
        </div>
        <div>
          <label class="label">Email *</label>
          <input v-model="createForm.email" type="email" class="input" required />
        </div>
        <div>
          <label class="label">Contraseña *</label>
          <input v-model="createForm.password" type="password" class="input" required minlength="8" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Rol *</label>
            <select v-model="createForm.role" class="input" required>
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Gerente</option>
              <option value="WAREHOUSE">Almacén</option>
              <option value="SALES">Ventas</option>
              <option value="VIEWER">Visualizador</option>
            </select>
          </div>
          <div>
            <label class="label">Teléfono</label>
            <input v-model="createForm.phone" class="input" />
          </div>
        </div>
      </form>
      <template #footer>
        <button class="btn-secondary" @click="showCreateModal = false">Cancelar</button>
        <button class="btn-primary" :disabled="saving" @click="submitCreate">
          {{ saving ? 'Creando...' : 'Crear Usuario' }}
        </button>
      </template>
    </AppModal>

    <!-- Edit Modal -->
    <AppModal v-model="showEditModal" title="Editar Usuario" size="md">
      <form @submit.prevent="submitEdit" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Nombre *</label>
            <input v-model="editForm.firstName" class="input" required />
          </div>
          <div>
            <label class="label">Apellido *</label>
            <input v-model="editForm.lastName" class="input" required />
          </div>
        </div>
        <div>
          <label class="label">Teléfono</label>
          <input v-model="editForm.phone" class="input" />
        </div>
        <div>
          <label class="label">Rol *</label>
          <select v-model="editForm.role" class="input" required>
            <option value="ADMIN">Admin</option>
            <option value="MANAGER">Gerente</option>
            <option value="WAREHOUSE">Almacén</option>
            <option value="SALES">Ventas</option>
            <option value="VIEWER">Visualizador</option>
          </select>
        </div>
        <div class="flex items-center gap-3">
          <input id="isActiveEdit" v-model="editForm.isActive" type="checkbox" class="w-4 h-4 rounded" />
          <label for="isActiveEdit" class="label mb-0">Usuario activo</label>
        </div>
      </form>
      <template #footer>
        <button class="btn-secondary" @click="showEditModal = false">Cancelar</button>
        <button class="btn-primary" :disabled="saving" @click="submitEdit">
          {{ saving ? 'Guardando...' : 'Actualizar' }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { usersApi } from '@/services/api'
import { ref, reactive, watch, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { PlusIcon, PencilIcon, PauseCircleIcon, PlayCircleIcon } from '@heroicons/vue/24/outline'
import DataTable from '@/components/ui/DataTable.vue'
import AppModal from '@/components/ui/AppModal.vue'
import SearchInput from '@/components/ui/SearchInput.vue'

const toast = useToast()
const loading = ref(false)
const saving = ref(false)
const users = ref([])
const showCreateModal = ref(false)
const showEditModal = ref(false)
const editingId = ref(null)

const pagination = reactive({ page: 1, limit: 20, total: 0 })
const filters = reactive({ search: '', role: '', isActive: '' })

const createForm = reactive({ firstName: '', lastName: '', email: '', password: '', role: 'WAREHOUSE', phone: '' })
const editForm = reactive({ firstName: '', lastName: '', phone: '', role: '', isActive: true })

const columns = [
  { key: 'name', label: 'Usuario' },
  { key: 'role', label: 'Rol' },
  { key: 'lastLogin', label: 'Último Acceso' },
  { key: 'isActive', label: 'Estado' },
  { key: 'actions', label: 'Acciones' },
]

function initials(row) {
  return ((row.firstName?.[0] || '') + (row.lastName?.[0] || '')).toUpperCase()
}

function roleBadge(role) {
  const m = { ADMIN: 'badge-red', MANAGER: 'badge-blue', WAREHOUSE: 'badge-blue', SALES: 'badge-green', VIEWER: 'badge-gray' }
  return m[role] || 'badge-gray'
}

function roleLabel(role) {
  const m = { ADMIN: 'Admin', MANAGER: 'Gerente', WAREHOUSE: 'Almacén', SALES: 'Ventas', VIEWER: 'Visualizador' }
  return m[role] || role
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function openCreate() {
  Object.assign(createForm, { firstName: '', lastName: '', email: '', password: '', role: 'WAREHOUSE', phone: '' })
  showCreateModal.value = true
}

function openEdit(row) {
  editingId.value = row.id
  Object.assign(editForm, { firstName: row.firstName, lastName: row.lastName, phone: row.phone || '', role: row.role, isActive: row.isActive })
  showEditModal.value = true
}

async function toggleActive(row) {
  try {
    await usersApi.update(row.id, { isActive: !row.isActive })
    toast.success(`Usuario ${row.isActive ? 'desactivado' : 'activado'}`)
    fetchUsers()
  } catch (err) {
    toast.error('Error al cambiar estado')
  }
}

async function submitCreate() {
  if (!createForm.firstName || !createForm.lastName || !createForm.email || !createForm.password) {
    toast.warning('Completa los campos requeridos')
    return
  }
  saving.value = true
  try {
    const payload = {
      firstName: createForm.firstName,
      lastName: createForm.lastName,
      email: createForm.email,
      password: createForm.password,
      role: createForm.role,
      ...(createForm.phone && { phone: createForm.phone }),
    }
    await usersApi.create(payload)
    toast.success('Usuario creado')
    showCreateModal.value = false
    fetchUsers()
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Error al crear usuario')
  } finally {
    saving.value = false
  }
}

async function submitEdit() {
  if (!editForm.firstName || !editForm.lastName) {
    toast.warning('Nombre y apellido son requeridos')
    return
  }
  saving.value = true
  try {
    await usersApi.update(editingId.value, editForm)
    toast.success('Usuario actualizado')
    showEditModal.value = false
    fetchUsers()
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Error al actualizar usuario')
  } finally {
    saving.value = false
  }
}

async function fetchUsers() {
  loading.value = true
  try {
    const res = await usersApi.list({
      page: pagination.page,
      limit: pagination.limit,
      search: filters.search,
      role: filters.role,
      isActive: filters.isActive,
    })
    const rawU = res.data.data || res.data.items || (Array.isArray(res.data) ? res.data : [])
    users.value = rawU.map(u => ({
      ...u,
      name: (u.firstName + ' ' + u.lastName).trim() || u.email,
    }))
    if ((res.data.meta?.total ?? res.data.total) !== undefined) pagination.total = res.data.meta?.total ?? res.data.total
  } catch (err) {
    toast.error('Error al cargar usuarios')
  } finally {
    loading.value = false
  }
}

function onPageChange(p) { pagination.page = p; fetchUsers() }
watch(filters, () => { pagination.page = 1; fetchUsers() })
onMounted(fetchUsers)
</script>
