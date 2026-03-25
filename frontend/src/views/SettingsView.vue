<template>
  <div class="space-y-6 max-w-3xl">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Configuración</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Preferencias de cuenta y sistema</p>
      </div>
    </div>

    <!-- Profile Section -->
    <div class="card">
      <h2 class="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <UserCircleIcon class="w-5 h-5 text-primary-500" />
        Perfil de Usuario
      </h2>
      <form @submit.prevent="saveProfile" class="space-y-4">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-300 text-xl font-bold flex-shrink-0 ring-2 ring-primary-200 dark:ring-primary-800">
            {{ profileInitials }}
          </div>
          <div>
            <p class="text-sm font-semibold text-slate-900 dark:text-white">{{ authStore.user?.email }}</p>
            <span :class="roleBadge(authStore.user?.role)">{{ roleLabel(authStore.user?.role) }}</span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Nombre *</label>
            <input v-model="profileForm.firstName" class="input" required />
          </div>
          <div>
            <label class="label">Apellido *</label>
            <input v-model="profileForm.lastName" class="input" required />
          </div>
        </div>
        <div>
          <label class="label">Teléfono</label>
          <input v-model="profileForm.phone" class="input" placeholder="Opcional" />
        </div>
        <div class="flex justify-end">
          <button type="submit" class="btn-primary" :disabled="savingProfile">
            {{ savingProfile ? 'Guardando...' : 'Guardar Perfil' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Security Section -->
    <div class="card">
      <h2 class="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <LockClosedIcon class="w-5 h-5 text-amber-500" />
        Seguridad
      </h2>
      <form @submit.prevent="changePassword" class="space-y-4">
        <div>
          <label class="label">Contraseña Actual *</label>
          <div class="relative">
            <input
              v-model="passwordForm.currentPassword"
              :type="showCurrentPwd ? 'text' : 'password'"
              class="input pr-10"
              required
            />
            <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" @click="showCurrentPwd = !showCurrentPwd">
              <EyeIcon v-if="!showCurrentPwd" class="w-4 h-4" />
              <EyeSlashIcon v-else class="w-4 h-4" />
            </button>
          </div>
        </div>
        <div>
          <label class="label">Nueva Contraseña *</label>
          <div class="relative">
            <input
              v-model="passwordForm.newPassword"
              :type="showNewPwd ? 'text' : 'password'"
              class="input pr-10"
              required
              minlength="8"
            />
            <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" @click="showNewPwd = !showNewPwd">
              <EyeIcon v-if="!showNewPwd" class="w-4 h-4" />
              <EyeSlashIcon v-else class="w-4 h-4" />
            </button>
          </div>
          <p class="text-xs text-gray-400 mt-1">Mínimo 8 caracteres</p>
        </div>
        <div>
          <label class="label">Confirmar Nueva Contraseña *</label>
          <input
            v-model="passwordForm.confirmPassword"
            type="password"
            class="input"
            required
            :class="passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword ? 'border-red-400 ring-1 ring-red-400' : ''"
          />
          <p v-if="passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword" class="text-xs text-red-500 mt-1">
            Las contraseñas no coinciden
          </p>
        </div>
        <div class="flex justify-end">
          <button
            type="submit"
            class="btn-primary"
            :disabled="savingPassword || !!(passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword)"
          >
            {{ savingPassword ? 'Cambiando...' : 'Cambiar Contraseña' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Appearance Section -->
    <div class="card">
      <h2 class="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <PaintBrushIcon class="w-5 h-5 text-purple-500" />
        Apariencia
      </h2>
      <div class="space-y-4">
        <!-- Dark Mode Toggle -->
        <div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-slate-700">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <MoonIcon class="w-4 h-4 text-slate-500 dark:text-slate-400" />
            </div>
            <div>
              <p class="text-sm font-medium text-slate-900 dark:text-white">Modo Oscuro</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Cambiar el tema de la aplicación</p>
            </div>
          </div>
          <button
            type="button"
            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            :class="uiStore.darkMode ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'"
            @click="uiStore.toggleDarkMode()"
          >
            <span
              class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
              :class="uiStore.darkMode ? 'translate-x-6' : 'translate-x-1'"
            />
          </button>
        </div>

        <!-- Sidebar compact Toggle -->
        <div class="flex items-center justify-between py-2">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Bars3Icon class="w-4 h-4 text-slate-500 dark:text-slate-400" />
            </div>
            <div>
              <p class="text-sm font-medium text-slate-900 dark:text-white">Barra lateral compacta</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Mostrar solo iconos en la barra lateral</p>
            </div>
          </div>
          <button
            type="button"
            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            :class="uiStore.sidebarCollapsed ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'"
            @click="uiStore.toggleCollapsed()"
          >
            <span
              class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
              :class="uiStore.sidebarCollapsed ? 'translate-x-6' : 'translate-x-1'"
            />
          </button>
        </div>
      </div>
    </div>

    <!-- ── CFDI / Facturación Section ── -->
    <div class="card">
      <h2 class="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <DocumentTextIcon class="w-5 h-5 text-emerald-500" />
        Facturación CFDI 4.0 — ContaDigital
      </h2>

      <!-- Not configured warning -->
      <div
        v-if="!cfdiConfig.isConfigured"
        class="mb-4 flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-sm text-amber-800 dark:text-amber-300"
      >
        <span class="mt-0.5 text-lg leading-none">⚠️</span>
        <span>La integración CFDI no está configurada. Completa los datos de conexión para poder timbrar facturas.</span>
      </div>

      <form @submit.prevent="saveCfdiConfig" class="space-y-5">
        <!-- ContaDigital connection -->
        <div>
          <h3 class="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Conexión ContaDigital</h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">ID Empresa *</label>
              <input v-model.number="cfdiForm.idEmpresa" type="number" class="input" placeholder="ej: 1234" />
            </div>
            <div>
              <label class="label">API Key *</label>
              <div class="relative">
                <input
                  v-model="cfdiForm.apiKey"
                  :type="showApiKey ? 'text' : 'password'"
                  class="input pr-10"
                  placeholder="Tu API Key de ContaDigital"
                />
                <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" @click="showApiKey = !showApiKey">
                  <EyeIcon v-if="!showApiKey" class="w-4 h-4" />
                  <EyeSlashIcon v-else class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          <div class="mt-3">
            <label class="label">Ambiente</label>
            <select v-model="cfdiForm.baseUrl" class="input w-full">
              <option value="https://app.contadigital.mx/dev/pruebas">🧪 Pruebas (Sandbox)</option>
              <option value="https://app.contadigital.mx">🚀 Producción</option>
            </select>
          </div>
          <div class="mt-2 flex gap-2">
            <button type="button" class="btn-secondary text-xs" :disabled="testingConn" @click="testCfdiConnection">
              {{ testingConn ? 'Probando...' : '🔌 Probar conexión' }}
            </button>
            <button type="button" class="btn-ghost text-xs" @click="loadUtiles">
              📋 Cargar catálogos
            </button>
          </div>
        </div>

        <!-- Datos del emisor -->
        <div>
          <h3 class="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Datos del Emisor</h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">ID RFC (ContaDigital)</label>
              <input v-model.number="cfdiForm.idRfc" type="number" class="input" placeholder="0" />
            </div>
            <div>
              <label class="label">ID Serie</label>
              <input v-model.number="cfdiForm.idSerie" type="number" class="input" placeholder="0" />
            </div>
            <div>
              <label class="label">ID Sucursal</label>
              <input v-model.number="cfdiForm.idSucursal" type="number" class="input" placeholder="0" />
            </div>
            <div>
              <label class="label">ID Lugar de Expedición</label>
              <input v-model.number="cfdiForm.idLugarExpedicion" type="number" class="input" placeholder="0" />
            </div>
            <div class="col-span-2">
              <label class="label">CP Lugar de Expedición</label>
              <input v-model="cfdiForm.lugarExpedicion" class="input" placeholder="ej: 64000" maxlength="5" />
            </div>
          </div>
        </div>

        <!-- Formas de pago -->
        <div>
          <h3 class="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-3 uppercase tracking-wide">IDs Formas de Pago (ContaDigital)</h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">ID Transferencia (03)</label>
              <input v-model.number="cfdiForm.idFormaPago03" type="number" class="input" placeholder="0" />
            </div>
            <div>
              <label class="label">ID Efectivo (01)</label>
              <input v-model.number="cfdiForm.idFormaPago01" type="number" class="input" placeholder="0" />
            </div>
            <div>
              <label class="label">ID Tarjeta Crédito (04)</label>
              <input v-model.number="cfdiForm.idFormaPago04" type="number" class="input" placeholder="0" />
            </div>
            <div>
              <label class="label">ID Por Definir (99)</label>
              <input v-model.number="cfdiForm.idFormaPago99" type="number" class="input" placeholder="0" />
            </div>
          </div>
        </div>

        <!-- Unidades de medida -->
        <div>
          <h3 class="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-3 uppercase tracking-wide">IDs Unidades de Medida (ContaDigital)</h3>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label class="label">KG</label>
              <input v-model.number="cfdiForm.idUmKg" type="number" class="input" placeholder="0" />
            </div>
            <div>
              <label class="label">TON</label>
              <input v-model.number="cfdiForm.idUmTon" type="number" class="input" placeholder="0" />
            </div>
            <div>
              <label class="label">Metro</label>
              <input v-model.number="cfdiForm.idUmMetro" type="number" class="input" placeholder="0" />
            </div>
            <div>
              <label class="label">Pieza</label>
              <input v-model.number="cfdiForm.idUmPieza" type="number" class="input" placeholder="0" />
            </div>
            <div>
              <label class="label">Lámina (SHEET)</label>
              <input v-model.number="cfdiForm.idUmLamina" type="number" class="input" placeholder="0" />
            </div>
            <div>
              <label class="label">Barra (BAR)</label>
              <input v-model.number="cfdiForm.idUmBarra" type="number" class="input" placeholder="0" />
            </div>
            <div>
              <label class="label">Tubo (TUBE)</label>
              <input v-model.number="cfdiForm.idUmTubo" type="number" class="input" placeholder="0" />
            </div>
            <div>
              <label class="label">Perfil (PROFILE)</label>
              <input v-model.number="cfdiForm.idUmPerfil" type="number" class="input" placeholder="0" />
            </div>
            <div>
              <label class="label">Rollo (ROLL)</label>
              <input v-model.number="cfdiForm.idUmRollo" type="number" class="input" placeholder="0" />
            </div>
            <div>
              <label class="label">Caja (BOX)</label>
              <input v-model.number="cfdiForm.idUmCaja" type="number" class="input" placeholder="0" />
            </div>
            <div class="col-span-2 sm:col-span-3">
              <label class="label">ID Producto Genérico (fallback)</label>
              <input v-model.number="cfdiForm.idProductoDefault" type="number" class="input w-full sm:w-1/3" placeholder="0" />
              <p class="text-xs text-gray-400 mt-1">Se usará cuando el producto no tenga ID de ContaDigital asignado</p>
            </div>
          </div>
        </div>

        <div class="flex justify-between items-center">
          <label class="flex items-center gap-2 cursor-pointer">
            <input v-model="cfdiForm.isConfigured" type="checkbox" class="rounded" />
            <span class="text-sm text-gray-700 dark:text-gray-300">Marcar como configurado</span>
          </label>
          <button type="submit" class="btn-primary" :disabled="savingCfdi">
            {{ savingCfdi ? 'Guardando...' : 'Guardar Configuración CFDI' }}
          </button>
        </div>
      </form>

      <!-- Utiles / Catálogos panel -->
      <div v-if="utilesData" class="mt-4 border-t border-gray-100 dark:border-slate-700 pt-4">
        <h3 class="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">Catálogos cargados de ContaDigital</h3>
        <pre class="text-xs bg-gray-50 dark:bg-slate-800 rounded-lg p-3 overflow-auto max-h-60 text-gray-700 dark:text-gray-300">{{ JSON.stringify(utilesData, null, 2) }}</pre>
      </div>
    </div>

    <!-- System Section -->
    <div class="card">
      <h2 class="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <CogIcon class="w-5 h-5 text-gray-500" />
        Sistema
      </h2>
      <div class="space-y-0 text-sm divide-y divide-gray-100 dark:divide-slate-700">
        <div class="flex justify-between py-2.5">
          <span class="text-gray-500 dark:text-gray-400">Versión</span>
          <span class="font-mono font-medium text-slate-800 dark:text-gray-200">v1.0.0</span>
        </div>
        <div class="flex justify-between py-2.5">
          <span class="text-gray-500 dark:text-gray-400">API</span>
          <span class="font-mono text-xs text-gray-600 dark:text-gray-300">{{ apiUrl }}</span>
        </div>
        <div class="flex justify-between py-2.5">
          <span class="text-gray-500 dark:text-gray-400">Usuario</span>
          <span class="font-medium text-slate-800 dark:text-gray-200">{{ authStore.user?.email }}</span>
        </div>
        <div class="flex justify-between py-2.5">
          <span class="text-gray-500 dark:text-gray-400">Rol</span>
          <span :class="roleBadge(authStore.user?.role)">{{ roleLabel(authStore.user?.role) }}</span>
        </div>
        <div class="flex justify-between py-2.5">
          <span class="text-gray-500 dark:text-gray-400">Último acceso</span>
          <span class="text-slate-800 dark:text-gray-200">{{ formatDate(authStore.user?.lastLogin) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { authApi, cfdiApi } from '@/services/api'
import { ref, reactive, computed, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import {
  UserCircleIcon, LockClosedIcon, CogIcon,
  EyeIcon, EyeSlashIcon, MoonIcon, Bars3Icon,
  PaintBrushIcon, DocumentTextIcon,
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const toast = useToast()
const authStore = useAuthStore()
const uiStore = useUiStore()

const savingProfile = ref(false)
const savingPassword = ref(false)
const showCurrentPwd = ref(false)
const showNewPwd = ref(false)
const showApiKey = ref(false)
const savingCfdi = ref(false)
const testingConn = ref(false)
const utilesData = ref(null)
const cfdiConfig = ref({ isConfigured: false })

const cfdiForm = reactive({
  idEmpresa: 0,
  apiKey: '',
  baseUrl: 'https://app.contadigital.mx/dev/pruebas',
  idRfc: 0,
  idSerie: 0,
  idSucursal: 0,
  idLugarExpedicion: 0,
  lugarExpedicion: '',
  idMoneda: 1,
  idFormaPago03: 0,
  idFormaPago04: 0,
  idFormaPago01: 0,
  idFormaPago99: 0,
  idUmKg: 0,
  idUmTon: 0,
  idUmMetro: 0,
  idUmPieza: 0,
  idUmRollo: 0,
  idUmLamina: 0,
  idUmBarra: 0,
  idUmTubo: 0,
  idUmPerfil: 0,
  idUmCaja: 0,
  idProductoDefault: 0,
  isConfigured: false,
})

const apiUrl = import.meta.env.VITE_API_URL || '/api/v1'

const profileForm = reactive({ firstName: '', lastName: '', phone: '' })
const passwordForm = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' })

const profileInitials = computed(() => {
  const u = authStore.user
  if (!u) return '?'
  return ((u.firstName?.[0] || '') + (u.lastName?.[0] || '')).toUpperCase()
})

function roleLabel(role) {
  const m = { ADMIN: 'Administrador', MANAGER: 'Gerente', WAREHOUSE: 'Almacén', SALES: 'Ventas', VIEWER: 'Visualizador' }
  return m[role] || role || '—'
}

function roleBadge(role) {
  const m = { ADMIN: 'badge-red', MANAGER: 'badge-blue', WAREHOUSE: 'badge-blue', SALES: 'badge-green', VIEWER: 'badge-gray' }
  return m[role] || 'badge-gray'
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

async function saveProfile() {
  if (!profileForm.firstName || !profileForm.lastName) {
    toast.warning('Nombre y apellido son requeridos')
    return
  }
  savingProfile.value = true
  try {
    const res = await authApi.updateProfile(profileForm)
    authStore.updateUser(res.data)
    toast.success('Perfil actualizado')
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Error al actualizar perfil')
  } finally {
    savingProfile.value = false
  }
}

async function changePassword() {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    toast.warning('Las contraseñas no coinciden')
    return
  }
  if (passwordForm.newPassword.length < 8) {
    toast.warning('La contraseña debe tener al menos 8 caracteres')
    return
  }
  savingPassword.value = true
  try {
    await authApi.changePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    })
    toast.success('Contraseña cambiada correctamente')
    Object.assign(passwordForm, { currentPassword: '', newPassword: '', confirmPassword: '' })
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Contraseña actual incorrecta')
  } finally {
    savingPassword.value = false
  }
}

async function saveCfdiConfig() {
  savingCfdi.value = true
  try {
    const res = await cfdiApi.updateConfig({ ...cfdiForm })
    cfdiConfig.value = res.data
    toast.success('Configuración CFDI guardada')
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Error al guardar configuración CFDI')
  } finally {
    savingCfdi.value = false
  }
}

async function testCfdiConnection() {
  testingConn.value = true
  try {
    await cfdiApi.updateConfig({ ...cfdiForm }) // save first
    const res = await cfdiApi.testConnection()
    if (res.data.ok) toast.success('✅ Conexión con ContaDigital exitosa')
    else toast.error('❌ No se pudo conectar con ContaDigital')
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Error de conexión con ContaDigital')
  } finally {
    testingConn.value = false
  }
}

async function loadUtiles() {
  try {
    const res = await cfdiApi.getUtiles()
    utilesData.value = res.data
    toast.info('Catálogos cargados')
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Error al cargar catálogos')
  }
}

async function loadCfdiConfig() {
  try {
    const res = await cfdiApi.getConfig()
    cfdiConfig.value = res.data
    Object.assign(cfdiForm, res.data)
    cfdiForm.apiKey = '' // don't pre-fill masked key
  } catch {
    // CFDI config not critical if error
  }
}

onMounted(() => {
  const u = authStore.user
  if (u) {
    profileForm.firstName = u.firstName || ''
    profileForm.lastName = u.lastName || ''
    profileForm.phone = u.phone || ''
  }
  loadCfdiConfig()
})
</script>
