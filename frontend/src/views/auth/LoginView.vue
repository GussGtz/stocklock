<template>
  <div class="min-h-screen flex">

    <!-- ── Left: Brand panel ── -->
    <div class="hidden lg:flex lg:w-[52%] relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-slate-900 flex-col justify-between p-12">
      <!-- Grid pattern overlay -->
      <div class="absolute inset-0 pointer-events-none opacity-10"
           style="background-image:linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px);background-size:40px 40px"></div>

      <!-- Glow blobs -->
      <div class="absolute top-0 right-0 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      <div class="absolute bottom-0 left-0 w-72 h-72 bg-primary-600/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>

      <!-- Logo -->
      <div class="relative z-10">
        <div class="flex items-center gap-4">
          <img src="@/assets/logo.png" alt="StockLock" class="w-[72px] h-[72px] object-contain drop-shadow-lg" />
          <span class="text-3xl font-bold text-white tracking-tight">StockLock</span>
        </div>
      </div>

      <!-- Hero content -->
      <div class="relative z-10 space-y-8">
        <div>
          <h1 class="text-4xl font-bold text-white leading-tight">
            Gestiona tu inventario<br/>con precisión total
          </h1>
          <p class="mt-4 text-primary-200 text-lg leading-relaxed">
            ERP especializado para empresas de aluminio. Control en tiempo real, reportes avanzados y alertas inteligentes.
          </p>
        </div>

        <!-- Feature pills -->
        <div class="flex flex-wrap gap-3">
          <div v-for="feat in features" :key="feat"
               class="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-4 py-2 text-sm text-white/90">
            <CheckIcon class="w-3.5 h-3.5 text-primary-300 flex-shrink-0" />
            {{ feat }}
          </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-3 gap-6">
          <div v-for="stat in heroStats" :key="stat.label" class="text-center">
            <div class="text-3xl font-bold text-white">{{ stat.value }}</div>
            <div class="text-xs text-primary-300 mt-1 font-medium">{{ stat.label }}</div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="relative z-10 text-xs text-primary-400">
        StockLock ERP v1.0 · Empresa de Aluminio
      </div>
    </div>

    <!-- ── Right: Login form ── -->
    <div class="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-gray-50 dark:bg-slate-950 relative">

      <!-- Mobile logo -->
      <div class="lg:hidden mb-8 flex items-center gap-3">
        <img src="@/assets/logo.png" alt="StockLock" class="w-16 h-16 object-contain" />
        <span class="text-2xl font-bold text-slate-900 dark:text-white">StockLock</span>
      </div>

      <div class="w-full max-w-md">
        <!-- Heading -->
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-slate-900 dark:text-white">Bienvenido de vuelta</h2>
          <p class="text-gray-500 dark:text-gray-400 mt-1 text-sm">Inicia sesión en tu cuenta para continuar</p>
        </div>

        <!-- Form card -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-card p-8">
          <form @submit.prevent="handleLogin" class="space-y-5">

            <!-- Email -->
            <div>
              <label class="label">Correo electrónico</label>
              <div class="relative">
                <EnvelopeIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  v-model="form.email"
                  type="email"
                  autocomplete="email"
                  required
                  placeholder="admin@stocklock.com"
                  class="input pl-9"
                  :class="{ 'input-error': error }"
                />
              </div>
            </div>

            <!-- Password -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="label mb-0">Contraseña</label>
              </div>
              <div class="relative">
                <LockClosedIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="current-password"
                  required
                  placeholder="••••••••"
                  class="input pl-9 pr-10"
                  :class="{ 'input-error': error }"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <EyeIcon v-if="!showPassword" class="w-4 h-4" />
                  <EyeSlashIcon v-else class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Error message -->
            <Transition name="error-fade">
              <div
                v-if="error"
                class="flex items-center gap-2.5 p-3 bg-red-50 dark:bg-red-600/10 border border-red-200 dark:border-red-500/20 rounded-lg text-red-700 dark:text-danger-400 text-sm"
              >
                <ExclamationCircleIcon class="w-4 h-4 flex-shrink-0" />
                {{ error }}
              </div>
            </Transition>

            <!-- Submit -->
            <button
              type="submit"
              :disabled="loading"
              class="btn-primary w-full py-2.5 mt-2 font-semibold text-sm"
            >
              <svg v-if="loading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              {{ loading ? 'Iniciando sesión...' : 'Iniciar sesión' }}
            </button>
          </form>

          <!-- Divider -->
          <div class="relative my-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-200 dark:border-slate-700"></div>
            </div>
            <div class="relative flex justify-center">
              <span class="px-3 text-xs text-gray-400 bg-white dark:bg-slate-800">Acceso de demostración</span>
            </div>
          </div>

          <!-- Demo fill button -->
          <button
            @click="fillDemo"
            class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
                   text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20
                   hover:bg-primary-100 dark:hover:bg-primary-900/30
                   border border-primary-200 dark:border-primary-700/50 transition-colors"
          >
            <BoltIcon class="w-4 h-4" />
            Rellenar credenciales de prueba
          </button>
        </div>

        <!-- Footer note -->
        <p class="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
          Acceso seguro · Todos los derechos reservados © {{ year }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  EyeIcon, EyeSlashIcon, ExclamationCircleIcon,
  EnvelopeIcon, LockClosedIcon, CheckIcon, BoltIcon,
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import { useWebSocket } from '@/composables/useWebSocket'

const router = useRouter()
const auth = useAuthStore()
const { connect } = useWebSocket()

const form = ref({ email: '', password: '' })
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')
const year = computed(() => new Date().getFullYear())

const features = ['Tiempo real', 'Multi-almacén', 'Alertas inteligentes', 'Reportes avanzados']
const heroStats = [
  { value: '10K+', label: 'Productos gestionados' },
  { value: '99.9%', label: 'Disponibilidad' },
  { value: '< 1s', label: 'Tiempo de respuesta' },
]

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(form.value.email, form.value.password)
    connect()
    router.push('/dashboard')
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Credenciales incorrectas. Intenta de nuevo.'
  } finally {
    loading.value = false
  }
}

function fillDemo() {
  form.value.email    = 'admin@stocklock.com'
  form.value.password = 'Admin123456!'
}
</script>

<style scoped>
.error-fade-enter-active, .error-fade-leave-active { transition: all 0.2s ease; }
.error-fade-enter-from, .error-fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
