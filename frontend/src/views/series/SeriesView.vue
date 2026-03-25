<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Series de Aleación</h1>
        <p class="page-subtitle">Catálogo de series de aleación de aluminio (1000–7000)</p>
      </div>
      <button class="btn-primary" @click="openModal()">
        <PlusIcon class="w-4 h-4" />
        Nueva Serie
      </button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div class="card text-center py-4">
        <div class="text-2xl font-bold text-slate-900 dark:text-white">{{ series.length }}</div>
        <div class="text-xs text-gray-500 mt-1">Total series</div>
      </div>
      <div class="card text-center py-4">
        <div class="text-2xl font-bold text-green-600">{{ series.filter(s => s.isActive).length }}</div>
        <div class="text-xs text-gray-500 mt-1">Activas</div>
      </div>
      <div class="card text-center py-4">
        <div class="text-2xl font-bold text-primary-600">{{ totalProducts }}</div>
        <div class="text-xs text-gray-500 mt-1">Productos asignados</div>
      </div>
      <div class="card text-center py-4">
        <div class="text-2xl font-bold text-amber-600">{{ series.filter(s => !s.isActive).length }}</div>
        <div class="text-xs text-gray-500 mt-1">Inactivas</div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div v-for="i in 4" :key="i" class="skeleton h-44" />
    </div>

    <!-- Empty -->
    <div v-else-if="series.length === 0" class="card text-center py-16">
      <div class="mx-auto w-14 h-14 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-4">
        <BeakerIcon class="w-7 h-7 text-gray-400" />
      </div>
      <p class="text-gray-500 mb-4">No hay series de aleación configuradas</p>
      <button class="btn-primary" @click="openModal()">Crear primera serie</button>
    </div>

    <!-- Series grid -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div
        v-for="s in series"
        :key="s.id"
        class="card-flat overflow-hidden transition-all duration-200"
        :class="!s.isActive ? 'opacity-60' : ''"
      >
        <div class="p-5">
          <!-- Header row -->
          <div class="flex items-start gap-4">
            <!-- Series code badge -->
            <div class="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center font-bold text-lg"
                 :class="seriesColor(s.code).bg">
              <span :class="seriesColor(s.code).text">{{ s.code }}</span>
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="font-bold text-slate-900 dark:text-white text-sm leading-tight">{{ s.name }}</h3>
                <span :class="s.isActive ? 'badge-green' : 'badge-gray'">
                  {{ s.isActive ? 'Activa' : 'Inactiva' }}
                </span>
              </div>
              <p v-if="s.principalAlloy" class="text-xs font-medium text-primary-600 dark:text-primary-400 mt-0.5">
                Elemento principal: {{ s.principalAlloy }}
              </p>
              <div class="flex items-center gap-2 mt-1.5">
                <span class="badge-gray text-xs">{{ s._count?.products ?? 0 }} productos</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-1 flex-shrink-0">
              <button class="btn-ghost btn-icon text-gray-400" :title="s.isActive ? 'Desactivar' : 'Activar'" @click="toggleSeries(s)">
                <component :is="s.isActive ? PauseCircleIcon : PlayCircleIcon" class="w-4 h-4"
                           :class="s.isActive ? 'text-amber-500' : 'text-green-500'" />
              </button>
              <button class="btn-ghost btn-icon text-gray-400" title="Editar" @click="openModal(s)">
                <PencilIcon class="w-4 h-4" />
              </button>
              <button class="btn-ghost btn-icon text-red-400 hover:text-red-600" title="Eliminar" @click="confirmDelete(s)">
                <TrashIcon class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Description -->
          <p v-if="s.description" class="text-sm text-gray-600 dark:text-gray-400 mt-3 leading-relaxed line-clamp-2">
            {{ s.description }}
          </p>

          <!-- Applications -->
          <div v-if="s.applications" class="mt-3 flex items-start gap-2">
            <WrenchScrewdriverIcon class="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
            <p class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{{ s.applications }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Create / Edit Modal -->
    <AppModal v-model="showModal" :title="editing ? 'Editar Serie' : 'Nueva Serie de Aleación'">
      <form @submit.prevent="save" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Código *</label>
            <input v-model="form.code" class="input" placeholder="Ej: 6000" required />
            <p class="text-xs text-gray-400 mt-1">Número de serie (1000, 2000...)</p>
          </div>
          <div>
            <label class="label">Nombre *</label>
            <input v-model="form.name" class="input" placeholder="Ej: Serie 6000 — Al-Mg-Si" required />
          </div>
        </div>
        <div>
          <label class="label">Elemento/s de aleación principal</label>
          <input v-model="form.principalAlloy" class="input" placeholder="Ej: Magnesio (Mg) + Silicio (Si)" />
        </div>
        <div>
          <label class="label">Descripción técnica</label>
          <textarea v-model="form.description" class="input" rows="3" placeholder="Propiedades y características de la serie..."></textarea>
        </div>
        <div>
          <label class="label">Aplicaciones principales</label>
          <textarea v-model="form.applications" class="input" rows="2" placeholder="Sectores y usos típicos..."></textarea>
        </div>
        <div>
          <label class="label">Orden de visualización</label>
          <input v-model.number="form.sortOrder" type="number" class="input" placeholder="0" />
        </div>
      </form>
      <template #footer>
        <button class="btn-secondary" @click="showModal = false">Cancelar</button>
        <button class="btn-primary" :disabled="saving" @click="save">
          {{ saving ? 'Guardando...' : (editing ? 'Actualizar' : 'Crear Serie') }}
        </button>
      </template>
    </AppModal>

    <!-- Confirm Delete -->
    <ConfirmModal
      v-model="showConfirm"
      :title="`Eliminar ${deletingItem?.name}`"
      :message="`¿Eliminar esta serie? Los productos asignados perderán su referencia de serie.`"
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
  PlusIcon, PencilIcon, TrashIcon, BeakerIcon,
  PauseCircleIcon, PlayCircleIcon, WrenchScrewdriverIcon,
} from '@heroicons/vue/24/outline'
import AppModal from '@/components/ui/AppModal.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import { seriesApi } from '@/services/api'

const toast = useToast()
const loading = ref(false)
const saving = ref(false)
const series = ref([])
const showModal = ref(false)
const showConfirm = ref(false)
const editing = ref(null)
const deletingItem = ref(null)

const defaultForm = () => ({ code: '', name: '', principalAlloy: '', description: '', applications: '', sortOrder: 0 })
const form = ref(defaultForm())

const totalProducts = computed(() => series.value.reduce((s, item) => s + (item._count?.products ?? 0), 0))

const seriesColorMap = {
  '1000': { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-300' },
  '2000': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
  '3000': { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400' },
  '4000': { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400' },
  '5000': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
  '6000': { bg: 'bg-primary-100 dark:bg-primary-900/30', text: 'text-primary-700 dark:text-primary-400' },
  '7000': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400' },
}

function seriesColor(code) {
  return seriesColorMap[code] || { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-300' }
}

async function fetchSeries() {
  loading.value = true
  try {
    const res = await seriesApi.list()
    series.value = Array.isArray(res.data) ? res.data : []
  } catch { toast.error('Error al cargar series') }
  finally { loading.value = false }
}

function openModal(s = null) {
  editing.value = s
  form.value = s
    ? { code: s.code, name: s.name, principalAlloy: s.principalAlloy || '', description: s.description || '', applications: s.applications || '', sortOrder: s.sortOrder || 0 }
    : defaultForm()
  showModal.value = true
}

async function save() {
  if (!form.value.code || !form.value.name) return
  saving.value = true
  try {
    if (editing.value) {
      const res = await seriesApi.update(editing.value.id, form.value)
      const idx = series.value.findIndex(s => s.id === editing.value.id)
      if (idx >= 0) series.value[idx] = { ...series.value[idx], ...res.data }
      toast.success('Serie actualizada')
    } else {
      const res = await seriesApi.create(form.value)
      series.value.push(res.data)
      series.value.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      toast.success('Serie creada')
    }
    showModal.value = false
  } catch (e) {
    toast.error(e.response?.data?.message || 'Error al guardar')
  } finally { saving.value = false }
}

async function toggleSeries(s) {
  try {
    const res = await seriesApi.toggle(s.id)
    const idx = series.value.findIndex(x => x.id === s.id)
    if (idx >= 0) series.value[idx] = { ...series.value[idx], ...res.data }
    toast.success(res.data.isActive ? 'Serie activada' : 'Serie desactivada')
  } catch { toast.error('Error al cambiar estado') }
}

function confirmDelete(s) {
  deletingItem.value = s
  showConfirm.value = true
}

async function doDelete() {
  try {
    await seriesApi.delete(deletingItem.value.id)
    series.value = series.value.filter(s => s.id !== deletingItem.value.id)
    toast.success('Serie eliminada')
  } catch { toast.error('Error al eliminar') }
}

onMounted(fetchSeries)
</script>
