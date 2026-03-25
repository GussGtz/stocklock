<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Sectores de Aluminio</h1>
        <p class="page-subtitle">Gestiona los sectores de aplicación y tipos de productos de aluminio</p>
      </div>
      <button class="btn-primary" @click="openSectorModal()">
        <PlusIcon class="w-4 h-4" />
        Nuevo Sector
      </button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div class="card text-center py-4">
        <div class="text-2xl font-bold text-slate-900 dark:text-white">{{ sectors.length }}</div>
        <div class="text-xs text-gray-500 mt-1">Total sectores</div>
      </div>
      <div class="card text-center py-4">
        <div class="text-2xl font-bold text-green-600">{{ sectors.filter(s => s.isActive).length }}</div>
        <div class="text-xs text-gray-500 mt-1">Activos</div>
      </div>
      <div class="card text-center py-4">
        <div class="text-2xl font-bold text-indigo-600">{{ totalTypes }}</div>
        <div class="text-xs text-gray-500 mt-1">Tipos registrados</div>
      </div>
      <div class="card text-center py-4">
        <div class="text-2xl font-bold text-amber-600">{{ activeTypes }}</div>
        <div class="text-xs text-gray-500 mt-1">Tipos activos</div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div v-for="i in 4" :key="i" class="skeleton h-48" />
    </div>

    <!-- Empty -->
    <div v-else-if="sectors.length === 0" class="card text-center py-16">
      <div class="mx-auto w-14 h-14 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-4">
        <SwatchIcon class="w-7 h-7 text-gray-400" />
      </div>
      <p class="text-gray-500">No hay sectores configurados</p>
      <button class="btn-primary mt-4" @click="openSectorModal()">Crear primer sector</button>
    </div>

    <!-- Sectors grid -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div
        v-for="sector in sectors"
        :key="sector.id"
        class="card-flat overflow-hidden transition-all duration-200"
        :class="!sector.isActive ? 'opacity-60' : ''"
      >
        <!-- Sector header -->
        <div class="p-5 flex items-start gap-4">
          <!-- Icon -->
          <div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
               :class="sector.isActive ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-gray-100 dark:bg-slate-800'">
            <component
              :is="sectorIcon(sector.name)"
              class="w-5 h-5"
              :class="sector.isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'"
            />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="font-bold text-slate-900 dark:text-white text-base">{{ sector.name }}</h3>
              <span :class="sector.isActive ? 'badge-green' : 'badge-gray'">
                {{ sector.isActive ? 'Activo' : 'Inactivo' }}
              </span>
            </div>
            <p v-if="sector.description" class="text-sm text-gray-500 mt-0.5 truncate">{{ sector.description }}</p>
            <div class="flex items-center gap-3 mt-2">
              <span class="badge-blue">{{ sector.types.length }} tipos</span>
              <span class="badge-gray">{{ sector._count?.products ?? 0 }} productos</span>
            </div>
          </div>
          <!-- Actions -->
          <div class="flex items-center gap-1 flex-shrink-0">
            <button class="btn-ghost btn-icon text-gray-400" title="Habilitar/Deshabilitar" @click="toggleSector(sector)">
              <component :is="sector.isActive ? PauseCircleIcon : PlayCircleIcon" class="w-5 h-5" :class="sector.isActive ? 'text-amber-500' : 'text-green-500'" />
            </button>
            <button class="btn-ghost btn-icon text-gray-400" title="Editar" @click="openSectorModal(sector)">
              <PencilIcon class="w-4 h-4" />
            </button>
            <button class="btn-ghost btn-icon text-red-400 hover:text-red-600" title="Eliminar" @click="confirmDeleteSector(sector)">
              <TrashIcon class="w-4 h-4" />
            </button>
            <button class="btn-ghost btn-icon text-gray-400" @click="toggleExpand(sector.id)">
              <ChevronDownIcon class="w-4 h-4 transition-transform duration-200" :class="expanded.has(sector.id) ? 'rotate-180' : ''" />
            </button>
          </div>
        </div>

        <!-- Types list (expandable) -->
        <Transition name="expand">
          <div v-if="expanded.has(sector.id)" class="border-t border-gray-100 dark:border-slate-700 bg-gray-50/60 dark:bg-slate-900/30">
            <div class="p-3 space-y-1">
              <div
                v-for="type in sector.types"
                :key="type.id"
                class="flex items-center gap-3 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700"
                :class="!type.isActive ? 'opacity-50' : ''"
              >
                <!-- Type icon -->
                <div class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                     :class="type.isActive ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-gray-100 dark:bg-slate-700'">
                  <TagIcon class="w-3.5 h-3.5" :class="type.isActive ? 'text-primary-500' : 'text-gray-400'" />
                </div>
                <div class="flex-1 min-w-0">
                  <span class="text-sm font-medium text-slate-800 dark:text-gray-200 truncate block">{{ type.name }}</span>
                  <span v-if="type.description" class="text-xs text-gray-400 truncate block">{{ type.description }}</span>
                </div>
                <span :class="type.isActive ? 'badge-green' : 'badge-gray'" class="flex-shrink-0">
                  {{ type.isActive ? 'Activo' : 'Inactivo' }}
                </span>
                <div class="flex items-center gap-0.5 flex-shrink-0">
                  <button class="btn-ghost p-1 rounded text-gray-400" title="Habilitar/Deshabilitar" @click="toggleType(sector, type)">
                    <component :is="type.isActive ? PauseCircleIcon : PlayCircleIcon" class="w-4 h-4" :class="type.isActive ? 'text-amber-500' : 'text-green-500'" />
                  </button>
                  <button class="btn-ghost p-1 rounded text-gray-400" @click="openTypeModal(sector, type)">
                    <PencilIcon class="w-3.5 h-3.5" />
                  </button>
                  <button class="btn-ghost p-1 rounded text-red-400 hover:text-red-600" @click="confirmDeleteType(sector, type)">
                    <TrashIcon class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <!-- Empty types -->
              <div v-if="sector.types.length === 0" class="text-center py-4 text-sm text-gray-400">
                Sin tipos registrados
              </div>

              <!-- Add type button -->
              <button
                class="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 border border-dashed border-primary-300 dark:border-primary-700 transition-colors"
                @click="openTypeModal(sector)"
              >
                <PlusIcon class="w-4 h-4" />
                Agregar tipo
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Sector Modal -->
    <AppModal v-model="showSectorModal" :title="editSector ? 'Editar Sector' : 'Nuevo Sector'">
      <form @submit.prevent="saveSector" class="space-y-4">
        <div>
          <label class="label">Nombre *</label>
          <input v-model="sectorForm.name" type="text" class="input" placeholder="Ej: Construcción y Arquitectura" required />
        </div>
        <div>
          <label class="label">Descripción</label>
          <input v-model="sectorForm.description" type="text" class="input" placeholder="Descripción opcional del sector" />
        </div>
      </form>
      <template #footer>
        <button class="btn-secondary" @click="showSectorModal = false">Cancelar</button>
        <button class="btn-primary" :disabled="saving" @click="saveSector">
          {{ saving ? 'Guardando...' : (editSector ? 'Actualizar' : 'Crear Sector') }}
        </button>
      </template>
    </AppModal>

    <!-- Type Modal -->
    <AppModal v-model="showTypeModal" :title="editType ? 'Editar Tipo' : 'Nuevo Tipo'">
      <div class="mb-4 flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800/60 rounded-lg border border-gray-200 dark:border-slate-700">
        <div class="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
          <component :is="sectorIcon(currentSector?.name)" class="w-4 h-4 text-primary-600 dark:text-primary-400" />
        </div>
        <span class="text-sm font-semibold text-slate-700 dark:text-gray-200">{{ currentSector?.name }}</span>
      </div>
      <form @submit.prevent="saveType" class="space-y-4">
        <div>
          <label class="label">Nombre del tipo *</label>
          <input v-model="typeForm.name" type="text" class="input" placeholder="Ej: Ventanas, Puertas, Canceles..." required />
        </div>
        <div>
          <label class="label">Descripción</label>
          <input v-model="typeForm.description" type="text" class="input" placeholder="Descripción opcional" />
        </div>
      </form>
      <template #footer>
        <button class="btn-secondary" @click="showTypeModal = false">Cancelar</button>
        <button class="btn-primary" :disabled="saving" @click="saveType">
          {{ saving ? 'Guardando...' : (editType ? 'Actualizar' : 'Agregar Tipo') }}
        </button>
      </template>
    </AppModal>

    <!-- Confirm Delete -->
    <ConfirmModal
      v-model="showConfirm"
      :title="confirmTitle"
      :message="confirmMessage"
      confirmText="Eliminar"
      variant="danger"
      @confirm="doDelete"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import {
  PlusIcon, PencilIcon, TrashIcon, ChevronDownIcon,
  PauseCircleIcon, PlayCircleIcon, SwatchIcon, TagIcon,
  BuildingOffice2Icon, WrenchScrewdriverIcon, TruckIcon,
  ArchiveBoxIcon, BoltIcon, SparklesIcon, Squares2X2Icon,
  GlobeAltIcon, CubeIcon,
} from '@heroicons/vue/24/outline'
import AppModal from '@/components/ui/AppModal.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import { sectorsApi } from '@/services/api'

const toast = useToast()

const loading = ref(false)
const saving  = ref(false)
const sectors = ref([])
const expanded = ref(new Set())

// Sector modal
const showSectorModal = ref(false)
const editSector = ref(null)
const sectorForm = ref({ name: '', description: '' })

// Type modal
const showTypeModal  = ref(false)
const editType       = ref(null)
const currentSector  = ref(null)
const typeForm       = ref({ name: '', description: '' })

// Confirm
const showConfirm    = ref(false)
const confirmTitle   = ref('')
const confirmMessage = ref('')
const deleteTarget   = ref(null)

const totalTypes  = computed(() => sectors.value.reduce((s, sec) => s + sec.types.length, 0))
const activeTypes = computed(() => sectors.value.reduce((s, sec) => s + sec.types.filter(t => t.isActive).length, 0))

/** Map a sector name to a Heroicon component */
function sectorIcon(name = '') {
  const n = name.toLowerCase()
  if (n.includes('construc') || n.includes('arquitect')) return BuildingOffice2Icon
  if (n.includes('mueble') || n.includes('mobili'))      return Squares2X2Icon
  if (n.includes('industri') || n.includes('manufactu')) return WrenchScrewdriverIcon
  if (n.includes('automotri') || n.includes('vehicul'))  return TruckIcon
  if (n.includes('aeronáut') || n.includes('aeronaut') || n.includes('aviaci')) return GlobeAltIcon
  if (n.includes('empaque') || n.includes('envase'))     return ArchiveBoxIcon
  if (n.includes('electr'))                              return BoltIcon
  if (n.includes('diseño') || n.includes('diseno') || n.includes('decorac')) return SparklesIcon
  return CubeIcon
}

async function fetchSectors() {
  loading.value = true
  try {
    const res = await sectorsApi.list()
    sectors.value = Array.isArray(res.data) ? res.data : []
  } catch { toast.error('Error al cargar sectores') }
  finally { loading.value = false }
}

function toggleExpand(id) {
  if (expanded.value.has(id)) expanded.value.delete(id)
  else expanded.value.add(id)
  expanded.value = new Set(expanded.value)
}

// Sector CRUD
function openSectorModal(sector = null) {
  editSector.value = sector
  sectorForm.value = sector
    ? { name: sector.name, description: sector.description || '' }
    : { name: '', description: '' }
  showSectorModal.value = true
}

async function saveSector() {
  if (!sectorForm.value.name.trim()) return
  saving.value = true
  try {
    if (editSector.value) {
      const res = await sectorsApi.update(editSector.value.id, sectorForm.value)
      const idx = sectors.value.findIndex(s => s.id === editSector.value.id)
      if (idx >= 0) sectors.value[idx] = res.data
      toast.success('Sector actualizado')
    } else {
      const res = await sectorsApi.create(sectorForm.value)
      sectors.value.push(res.data)
      toast.success('Sector creado')
    }
    showSectorModal.value = false
  } catch (e) {
    toast.error(e.response?.data?.message || 'Error al guardar sector')
  } finally { saving.value = false }
}

async function toggleSector(sector) {
  try {
    const res = await sectorsApi.toggle(sector.id)
    const idx = sectors.value.findIndex(s => s.id === sector.id)
    if (idx >= 0) sectors.value[idx] = res.data
    toast.success(res.data.isActive ? 'Sector activado' : 'Sector desactivado')
  } catch { toast.error('Error al cambiar estado') }
}

// Type CRUD
function openTypeModal(sector, type = null) {
  currentSector.value = sector
  editType.value = type
  typeForm.value = type
    ? { name: type.name, description: type.description || '' }
    : { name: '', description: '' }
  showTypeModal.value = true
  if (!expanded.value.has(sector.id)) toggleExpand(sector.id)
}

async function saveType() {
  if (!typeForm.value.name.trim()) return
  saving.value = true
  try {
    if (editType.value) {
      const res = await sectorsApi.updateType(currentSector.value.id, editType.value.id, typeForm.value)
      const sector = sectors.value.find(s => s.id === currentSector.value.id)
      if (sector) {
        const idx = sector.types.findIndex(t => t.id === editType.value.id)
        if (idx >= 0) sector.types[idx] = res.data
      }
      toast.success('Tipo actualizado')
    } else {
      const res = await sectorsApi.createType(currentSector.value.id, typeForm.value)
      const sector = sectors.value.find(s => s.id === currentSector.value.id)
      if (sector) sector.types.push(res.data)
      toast.success('Tipo agregado')
    }
    showTypeModal.value = false
  } catch (e) {
    toast.error(e.response?.data?.message || 'Error al guardar tipo')
  } finally { saving.value = false }
}

async function toggleType(sector, type) {
  try {
    const res = await sectorsApi.toggleType(sector.id, type.id)
    const sec = sectors.value.find(s => s.id === sector.id)
    if (sec) {
      const idx = sec.types.findIndex(t => t.id === type.id)
      if (idx >= 0) sec.types[idx] = res.data
    }
  } catch { toast.error('Error al cambiar estado del tipo') }
}

// Delete
function confirmDeleteSector(sector) {
  confirmTitle.value = `Eliminar "${sector.name}"`
  confirmMessage.value = `Se eliminarán también todos los tipos de este sector. Esta acción no se puede deshacer.`
  deleteTarget.value = { kind: 'sector', sector }
  showConfirm.value = true
}

function confirmDeleteType(sector, type) {
  confirmTitle.value = `Eliminar tipo "${type.name}"`
  confirmMessage.value = `¿Estás seguro de eliminar este tipo de la lista?`
  deleteTarget.value = { kind: 'type', sector, type }
  showConfirm.value = true
}

async function doDelete() {
  const target = deleteTarget.value
  try {
    if (target.kind === 'sector') {
      await sectorsApi.delete(target.sector.id)
      sectors.value = sectors.value.filter(s => s.id !== target.sector.id)
      toast.success('Sector eliminado')
    } else {
      await sectorsApi.deleteType(target.sector.id, target.type.id)
      const sec = sectors.value.find(s => s.id === target.sector.id)
      if (sec) sec.types = sec.types.filter(t => t.id !== target.type.id)
      toast.success('Tipo eliminado')
    }
  } catch { toast.error('Error al eliminar') }
}

onMounted(fetchSectors)
</script>

<style scoped>
.expand-enter-active, .expand-leave-active { transition: all 0.2s ease; overflow: hidden; }
.expand-enter-from, .expand-leave-to { opacity: 0; max-height: 0; }
.expand-enter-to, .expand-leave-from { opacity: 1; max-height: 600px; }
</style>
