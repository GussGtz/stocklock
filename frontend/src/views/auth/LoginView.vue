<template>
  <div class="min-h-screen flex bg-white">

    <!-- ── Left: Atlas-style brand panel ── -->
    <div class="hidden lg:flex lg:w-[44%] relative overflow-hidden flex-col bg-gradient-to-b from-[#0EA5E9] to-[#0284C7]">

      <!-- Subtle pattern overlay -->
      <div class="absolute inset-0 pointer-events-none opacity-[0.07]"
           style="background-image:radial-gradient(circle at 1px 1px, white 1px, transparent 0);background-size:28px 28px"></div>

      <!-- Decorative circles -->
      <div class="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-white/10 pointer-events-none" />
      <div class="absolute top-1/2 -right-16 w-56 h-56 rounded-full bg-white/10 pointer-events-none" />
      <div class="absolute -bottom-24 -left-8 w-64 h-64 rounded-full bg-white/10 pointer-events-none" />

      <!-- Logo top -->
      <div class="relative z-10 p-10">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <img src="@/assets/logo.png" alt="StockLock" class="w-7 h-7 object-contain" />
          </div>
          <span class="text-2xl font-bold text-white tracking-tight">StockLock</span>
          <span class="text-xs font-semibold text-white/60 border border-white/30 rounded-full px-2 py-0.5 ml-1">ERP</span>
        </div>
      </div>

      <!-- Center content -->
      <div class="relative z-10 flex-1 flex flex-col items-center justify-center px-10 text-center">
        <!-- Big ERP illustration using SVG shapes -->
        <div class="relative w-64 h-48 mb-8">
          <!-- Isometric-style illustration blocks -->
          <svg viewBox="0 0 280 200" class="w-full h-full" fill="none">
            <!-- Floor -->
            <ellipse cx="140" cy="170" rx="110" ry="22" fill="white" fill-opacity="0.1"/>
            <!-- Main building block -->
            <rect x="80" y="80" width="80" height="85" rx="4" fill="white" fill-opacity="0.2"/>
            <rect x="84" y="84" width="72" height="16" rx="2" fill="white" fill-opacity="0.3"/>
            <rect x="84" y="104" width="32" height="24" rx="2" fill="white" fill-opacity="0.25"/>
            <rect x="120" y="104" width="32" height="24" rx="2" fill="white" fill-opacity="0.25"/>
            <rect x="84" y="132" width="72" height="28" rx="2" fill="white" fill-opacity="0.2"/>
            <!-- Left tower -->
            <rect x="40" y="100" width="38" height="65" rx="4" fill="white" fill-opacity="0.15"/>
            <rect x="44" y="104" width="30" height="12" rx="2" fill="white" fill-opacity="0.3"/>
            <!-- Right tower -->
            <rect x="162" y="110" width="42" height="55" rx="4" fill="white" fill-opacity="0.15"/>
            <rect x="166" y="114" width="34" height="12" rx="2" fill="white" fill-opacity="0.3"/>
            <!-- People dots -->
            <circle cx="65" cy="90" r="8" fill="white" fill-opacity="0.4"/>
            <circle cx="65" cy="75" r="5" fill="white" fill-opacity="0.35"/>
            <circle cx="195" cy="100" r="8" fill="white" fill-opacity="0.4"/>
            <circle cx="195" cy="85" r="5" fill="white" fill-opacity="0.35"/>
            <!-- Connecting arrows / lines -->
            <path d="M 90 75 Q 140 40 195 75" stroke="white" stroke-opacity="0.3" stroke-width="1.5" stroke-dasharray="4 4"/>
            <!-- Chart bar icon top right -->
            <rect x="205" y="40" width="6" height="20" rx="1" fill="white" fill-opacity="0.5"/>
            <rect x="215" y="30" width="6" height="30" rx="1" fill="white" fill-opacity="0.5"/>
            <rect x="225" y="46" width="6" height="14" rx="1" fill="white" fill-opacity="0.5"/>
            <!-- Box icon bottom left -->
            <rect x="25" y="145" width="22" height="18" rx="2" fill="white" fill-opacity="0.4"/>
            <path d="M25 151 h22" stroke="white" stroke-opacity="0.6" stroke-width="1"/>
            <path d="M36 145 v18" stroke="white" stroke-opacity="0.4" stroke-width="1"/>
          </svg>
        </div>

        <h1 class="text-3xl font-bold text-white leading-tight mb-3">
          Aumenta la productividad<br/>de tu empresa
        </h1>
        <p class="text-white/70 text-base leading-relaxed">
          ERP especializado para empresas de aluminio con control en tiempo real.
        </p>

        <!-- Feature pills -->
        <div class="flex flex-wrap gap-2 justify-center mt-6">
          <div v-for="feat in features" :key="feat"
               class="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1.5 text-xs text-white/90 font-medium">
            <CheckIcon class="w-3 h-3 text-white/80 flex-shrink-0" />
            {{ feat }}
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="relative z-10 p-8 text-xs text-white/40 flex gap-4">
        <span>Términos</span>
        <span>Contacto</span>
        <span>Soporte</span>
      </div>
    </div>

    <!-- ── Right: Login form ── -->
    <div class="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-white dark:bg-slate-950 relative">

      <!-- Mobile logo -->
      <div class="lg:hidden mb-8 flex items-center gap-3">
        <img src="@/assets/logo.png" alt="StockLock" class="w-10 h-10 object-contain" />
        <span class="text-2xl font-bold text-slate-800 dark:text-white">StockLock</span>
      </div>

      <div class="w-full max-w-[380px]">

        <!-- Heading -->
        <div class="mb-7">
          <div class="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 bg-sky-50 dark:bg-sky-900/20 px-3 py-1.5 rounded-full mb-4">
            <div class="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></div>
            Bienvenido a StockLock
          </div>
          <h2 class="text-2xl font-bold text-slate-800 dark:text-white">Inicia sesión</h2>
          <p class="text-slate-500 dark:text-gray-400 mt-1 text-sm">Accede a tu cuenta para continuar</p>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleLogin" class="space-y-4">

          <!-- Email -->
          <div>
            <label class="label">Email</label>
            <div class="relative">
              <EnvelopeIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                v-model="form.email"
                type="email"
                autocomplete="email"
                required
                placeholder="usuario@empresa.com"
                class="input pl-9"
                :class="{ 'input-error': error }"
              />
            </div>
          </div>

          <!-- Password -->
          <div>
            <label class="label">Contraseña</label>
            <div class="relative">
              <LockClosedIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                required
                placeholder="••••••••"
                class="input pl-9 pr-10"
                :class="{ 'input-error': error }"
              />
              <button type="button" @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                <EyeIcon v-if="!showPassword" class="w-4 h-4" />
                <EyeSlashIcon v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Error -->
          <Transition name="error-fade">
            <div v-if="error"
              class="flex items-center gap-2.5 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              <ExclamationCircleIcon class="w-4 h-4 flex-shrink-0" />
              {{ error }}
            </div>
          </Transition>

          <!-- Submit -->
          <button type="submit" :disabled="loading" class="btn-primary w-full py-2.5 text-sm rounded-lg mt-1">
            <svg v-if="loading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            {{ loading ? 'Iniciando sesión...' : 'Iniciar sesión' }}
          </button>
        </form>

        <!-- Demo accounts -->
        <div class="mt-6">
          <div class="relative mb-4">
            <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-[#E8EDF2] dark:border-slate-700"></div></div>
            <div class="relative flex justify-center">
              <span class="px-3 text-xs text-slate-400 bg-white dark:bg-slate-950">Cuentas de demostración</span>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-1.5">
            <button
              v-for="demo in demoAccounts"
              :key="demo.email"
              @click="fillDemo(demo)"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all border
                     bg-[#F8FAFC] dark:bg-slate-800/60 border-[#E8EDF2] dark:border-slate-700/60
                     hover:bg-[#EEF5FC] hover:border-sky-200 dark:hover:bg-slate-700 dark:hover:border-slate-500"
            >
              <div :class="['w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold', demo.color]">
                {{ demo.initials }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{{ demo.name }}</div>
                <div class="text-[11px] text-slate-400 truncate">{{ demo.email }}</div>
              </div>
              <span :class="['text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0', demo.badgeClass]">
                {{ demo.role }}
              </span>
            </button>
          </div>
        </div>

        <!-- Footer -->
        <p class="text-center text-xs text-slate-400 dark:text-slate-500 mt-6">
          Acceso seguro · © {{ year }} StockLock ERP
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
  EnvelopeIcon, LockClosedIcon, CheckIcon,
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import { useWebSocket } from '@/composables/useWebSocket'

const router = useRouter()
const auth   = useAuthStore()
const { connect } = useWebSocket()

const form         = ref({ email: '', password: '' })
const showPassword = ref(false)
const loading      = ref(false)
const error        = ref('')
const year         = computed(() => new Date().getFullYear())

const features = ['Tiempo real', 'Multi-almacén', 'Alertas inteligentes', 'Reportes avanzados']

const demoAccounts = [
  { name: 'Admin StockLock',  email: 'admin@stocklock.com',   password: 'Admin123456!', role: 'ADMIN',     initials: 'AS', color: 'bg-red-500',    badgeClass: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  { name: 'Carlos Gerente',   email: 'gerente@stocklock.com', password: 'Demo123456!',  role: 'MANAGER',   initials: 'CG', color: 'bg-sky-500',    badgeClass: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' },
  { name: 'Luis Almacén',     email: 'almacen@stocklock.com', password: 'Demo123456!',  role: 'WAREHOUSE', initials: 'LA', color: 'bg-amber-500',  badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  { name: 'Ana Ventas',       email: 'ventas@stocklock.com',  password: 'Demo123456!',  role: 'SALES',     initials: 'AV', color: 'bg-emerald-500',badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { name: 'María Viewer',     email: 'viewer@stocklock.com',  password: 'Demo123456!',  role: 'VIEWER',    initials: 'MV', color: 'bg-slate-500',  badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400' },
]

async function handleLogin() {
  error.value   = ''
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

function fillDemo(demo: { email: string; password: string }) {
  form.value.email    = demo.email
  form.value.password = demo.password
}
</script>

<style scoped>
.error-fade-enter-active, .error-fade-leave-active { transition: all 0.2s ease; }
.error-fade-enter-from, .error-fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
