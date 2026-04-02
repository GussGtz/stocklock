<template>
  <div class="space-y-6">
    <!-- Back + Header -->
    <div class="page-header">
      <div class="flex items-center gap-4">
        <button class="btn-ghost p-2 rounded-lg" @click="$router.push('/quotes')">
          <ArrowLeftIcon class="w-5 h-5" />
        </button>
        <div>
          <div class="flex items-center gap-3">
            <h1 class="page-title">{{ quote?.folio || 'Cargando...' }}</h1>
            <span v-if="quote" :class="statusBadge(quote.status)">{{ statusLabel(quote.status) }}</span>
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Cotización / Presupuesto comercial</p>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="flex gap-2 flex-wrap" v-if="quote">
        <button
          class="btn-secondary flex items-center gap-2"
          @click="generatePdf(quote)"
        >
          <ArrowDownTrayIcon class="w-4 h-4" />
          Descargar PDF
        </button>
        <button
          v-if="quote.status === 'DRAFT'"
          class="btn-primary flex items-center gap-2 bg-sky-600 hover:bg-sky-700 focus:ring-sky-500"
          :disabled="actionLoading"
          @click="openEmail"
        >
          <EnvelopeIcon class="w-4 h-4" />
          Enviar por Correo
        </button>
        <button
          v-if="quote.status === 'DRAFT'"
          class="btn-primary flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
          :disabled="actionLoading"
          @click="openWA"
        >
          <ChatBubbleLeftIcon class="w-4 h-4" />
          Enviar por WhatsApp
        </button>
        <button
          v-if="quote.status === 'SENT'"
          class="btn-primary flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
          :disabled="actionLoading"
          @click="doApprove"
        >
          <CheckCircleIcon class="w-4 h-4" />
          Aprobar
        </button>
        <button
          v-if="quote.status === 'APPROVED'"
          class="btn-primary flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"
          :disabled="actionLoading"
          @click="doConvert"
        >
          <ArrowRightCircleIcon class="w-4 h-4" />
          Convertir a Venta
        </button>
        <button
          v-if="['SENT', 'APPROVED'].includes(quote.status)"
          class="btn-danger flex items-center gap-2"
          @click="showRejectModal = true"
        >
          <XCircleIcon class="w-4 h-4" />
          Rechazar
        </button>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-pulse">
      <div class="card lg:col-span-2"><div class="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div></div>
      <div class="card"><div class="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div></div>
    </div>

    <template v-else-if="quote">
      <!-- Info cards -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Customer info -->
        <div class="card lg:col-span-2">
          <h3 class="font-semibold text-gray-900 dark:text-white mb-3">Información del Cliente</h3>
          <div class="grid grid-cols-2 gap-y-2 text-sm">
            <span class="text-gray-500 dark:text-gray-400">Cliente</span>
            <span class="font-medium">{{ quote.customer?.name ?? '—' }}</span>
            <span class="text-gray-500 dark:text-gray-400">RFC</span>
            <span>{{ quote.customer?.rfc ?? '—' }}</span>
            <span class="text-gray-500 dark:text-gray-400">Contacto</span>
            <span>{{ quote.customer?.contactName ?? '—' }}</span>
            <span class="text-gray-500 dark:text-gray-400">Teléfono</span>
            <span>{{ quote.customer?.phone ?? '—' }}</span>
            <span class="text-gray-500 dark:text-gray-400">Email</span>
            <span>{{ quote.customer?.email ?? '—' }}</span>
            <span class="text-gray-500 dark:text-gray-400">Elaboró</span>
            <span>{{ quote.user ? `${quote.user.firstName} ${quote.user.lastName}` : '—' }}</span>
            <span class="text-gray-500 dark:text-gray-400">Notas</span>
            <span>{{ quote.notes || '—' }}</span>
          </div>
        </div>

        <!-- Dates + Totals -->
        <div class="card">
          <h3 class="font-semibold text-gray-900 dark:text-white mb-3">Fechas y Totales</h3>
          <div class="space-y-2 text-sm mb-4">
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">Creada</span>
              <span>{{ formatDate(quote.createdAt) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">Vigencia</span>
              <span :class="isExpiringSoon(quote.validUntil) ? 'text-amber-500 font-semibold' : ''">
                {{ formatDate(quote.validUntil) }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">Moneda</span>
              <span>{{ quote.currency }} <span v-if="quote.currency !== 'MXN'" class="text-xs text-gray-400">(TC: {{ quote.exchangeRate }})</span></span>
            </div>
          </div>
          <div class="border-t border-gray-100 dark:border-gray-700 pt-3 space-y-1 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">Subtotal</span>
              <span>{{ formatCurrency(quote.subtotal) }}</span>
            </div>
            <div class="flex justify-between" v-if="Number(quote.discount) > 0">
              <span class="text-gray-500 dark:text-gray-400">Descuento</span>
              <span class="text-red-500">-{{ formatCurrency(quote.discount) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">IVA 16%</span>
              <span>{{ formatCurrency(quote.tax) }}</span>
            </div>
            <div class="flex justify-between font-bold text-base border-t border-gray-200 dark:border-gray-600 pt-1 mt-1">
              <span>Total</span>
              <span>{{ formatCurrency(quote.total) }}</span>
            </div>
          </div>

          <!-- Converted to sale link -->
          <div v-if="quote.status === 'CONVERTED' && quote.saleOrderId" class="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
            <RouterLink
              :to="`/sales/${quote.saleOrderId}`"
              class="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 text-sm font-medium"
            >
              <ArrowRightCircleIcon class="w-4 h-4" />
              Ver Venta Generada
            </RouterLink>
          </div>
        </div>
      </div>

      <!-- Items table -->
      <div class="card p-0">
        <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 class="font-semibold text-gray-900 dark:text-white">Partidas</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">#</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Producto</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cantidad</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Precio U.</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Desc.</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subtotal</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Notas</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr v-for="(item, idx) in quote.items" :key="item.id" class="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                <td class="px-4 py-3 text-gray-400">{{ idx + 1 }}</td>
                <td class="px-4 py-3">
                  <div class="font-medium text-gray-900 dark:text-white">{{ item.product?.name }}</div>
                  <div class="text-xs text-gray-400">{{ item.product?.code }}</div>
                </td>
                <td class="px-4 py-3 text-right">{{ item.quantity }}</td>
                <td class="px-4 py-3 text-right">{{ formatCurrency(item.unitPrice) }}</td>
                <td class="px-4 py-3 text-right">
                  <span v-if="item.discount">{{ item.discount }}%</span>
                  <span v-else class="text-gray-300 dark:text-gray-600">—</span>
                </td>
                <td class="px-4 py-3 text-right font-semibold">{{ formatCurrency(item.subtotal) }}</td>
                <td class="px-4 py-3 text-gray-500 text-xs">{{ item.notes || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Status timeline -->
      <div class="card">
        <h3 class="font-semibold text-gray-900 dark:text-white mb-4">Flujo de Estado</h3>
        <div class="flex items-center gap-2 flex-wrap">
          <div v-for="(step, i) in statusFlow" :key="step.key" class="flex items-center gap-2">
            <div class="flex items-center gap-2">
              <div
                :class="[
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                  isStepReached(step.key)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                ]"
              >
                {{ i + 1 }}
              </div>
              <span :class="['text-sm', isStepReached(step.key) ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500']">
                {{ step.label }}
              </span>
            </div>
            <div v-if="i < statusFlow.length - 1" class="w-6 h-px bg-gray-200 dark:bg-gray-700"></div>
          </div>
        </div>
      </div>
    </template>

    <!-- Not found -->
    <div v-else-if="!loading" class="card text-center py-10 text-gray-500">
      Cotización no encontrada.
    </div>

    <!-- WhatsApp Modal -->
    <AppModal v-model="showWAModal" title="Enviar por WhatsApp" size="md">
      <div class="space-y-4">
        <div class="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl p-3 text-sm text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
          <ChatBubbleLeftIcon class="w-4 h-4 mt-0.5 shrink-0" />
          <span>Se incluirá un link de descarga del PDF en el mensaje. El cliente lo abre con un toque.</span>
        </div>
        <div>
          <label class="label">Teléfono <span class="text-red-500">*</span></label>
          <input v-model="waForm.phone" type="tel" class="input" placeholder="9981234567 o +529981234567" />
          <p class="text-xs text-slate-400 mt-1">10 dígitos MX o formato internacional</p>
        </div>
        <div>
          <label class="label">Mensaje</label>
          <textarea v-model="waForm.message" rows="8" class="input font-mono text-xs leading-relaxed"></textarea>
        </div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="showWAModal = false">Cancelar</button>
        <button class="btn-primary bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2" @click="doSendWA">
          <ChatBubbleLeftIcon class="w-4 h-4" />
          Abrir WhatsApp
        </button>
      </template>
    </AppModal>

    <!-- Email Modal -->
    <AppModal v-model="showEmailModal" title="Enviar cotización por correo" size="md">
      <div class="space-y-4">
        <div>
          <label class="label">Para <span class="text-red-500">*</span></label>
          <input v-model="emailForm.to" type="email" class="input" placeholder="cliente@empresa.com" />
        </div>
        <div>
          <label class="label">CC <span class="text-slate-400 text-xs">(opcional)</span></label>
          <input v-model="emailForm.cc" type="email" class="input" placeholder="otro@empresa.com" />
        </div>
        <div>
          <label class="label">Asunto</label>
          <input v-model="emailForm.subject" type="text" class="input" />
        </div>
        <div>
          <label class="label">Mensaje</label>
          <textarea v-model="emailForm.message" rows="5" class="input font-sans text-sm leading-relaxed"></textarea>
        </div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="showEmailModal = false">Cancelar</button>
        <button class="btn-primary flex items-center gap-2" :disabled="actionLoading" @click="doSendEmail">
          <EnvelopeIcon class="w-4 h-4" />
          {{ actionLoading ? 'Enviando...' : 'Enviar correo' }}
        </button>
      </template>
    </AppModal>

    <!-- Reject Modal -->
    <AppModal v-model="showRejectModal" title="Rechazar Cotización" size="sm">
      <div class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">Indica el motivo del rechazo para informar al equipo.</p>
        <div>
          <label class="label">Motivo</label>
          <textarea v-model="rejectReason" class="input min-h-[80px]" placeholder="Precio fuera de presupuesto, cambio de requerimientos..."></textarea>
        </div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="showRejectModal = false">Cancelar</button>
        <button class="btn-danger" :disabled="actionLoading" @click="doReject">
          {{ actionLoading ? 'Rechazando...' : 'Rechazar' }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  EnvelopeIcon,
  ChatBubbleLeftIcon,
  ArrowRightCircleIcon,
  ArrowDownTrayIcon,
} from '@heroicons/vue/24/outline'
import { sendWhatsApp, buildQuoteMessage } from '@/composables/useWhatsApp'
import { quotesApi } from '@/services/api'
import AppModal from '@/components/ui/AppModal.vue'
import { useToast } from 'vue-toastification'
import { useQuotePdf } from '@/composables/useQuotePdf'

const route  = useRoute()
const router = useRouter()
const toast  = useToast()
const { generate: _generatePdf, generateBase64: _generatePdfBase64 } = useQuotePdf()
async function generatePdf(q: any) {
  try { await _generatePdf(q) }
  catch { toast.error('Error al generar PDF') }
}

const loading       = ref(true)
const actionLoading = ref(false)
const quote         = ref<any>(null)
const showRejectModal = ref(false)
const showEmailModal  = ref(false)
const showWAModal     = ref(false)
const rejectReason = ref('')
const emailForm = reactive({ to: '', cc: '', subject: '', message: '' })
const waForm    = reactive({ phone: '', message: '' })

const id = computed(() => route.params.id as string)

async function load() {
  loading.value = true
  try {
    const res = await quotesApi.get(id.value)
    quote.value = res.data
  } catch {
    toast.error('Error al cargar la cotización')
  } finally {
    loading.value = false
  }
}

onMounted(load)

// ── Actions ──────────────────────────────────────────────────────────────────

function openWA() {
  const q = quote.value
  waForm.phone   = q.customer?.phone ?? ''
  waForm.message = buildQuoteMessage(q)
  showWAModal.value = true
}

async function doSendWA() {
  if (!waForm.phone) { toast.error('Ingresa el número de WhatsApp'); return }
  let message = waForm.message
  try {
    const base64 = await _generatePdfBase64(quote.value)
    const res = await quotesApi.uploadPdf(quote.value.id, base64)
    message = message + `\n\n📄 *PDF:* ${res.data.url}`
  } catch { /* non-fatal */ }
  sendWhatsApp(waForm.phone, message)
  showWAModal.value = false
}

function openEmail() {
  const q = quote.value
  Object.assign(emailForm, {
    to:      q.customer?.email ?? '',
    cc:      '',
    subject: `Cotización ${q.folio} — CALUTEC`,
    message: `Estimado(a) ${q.customer?.name ?? 'cliente'},\n\nAdjunto encontrará los detalles de nuestra cotización ${q.folio}.\n\nQuedamos a sus órdenes para cualquier aclaración.\n\nSaludos,\nEquipo CALUTEC`,
  })
  showEmailModal.value = true
}

async function doSendEmail() {
  if (!emailForm.to) { toast.error('Ingresa el correo del destinatario'); return }
  if (actionLoading.value) return
  actionLoading.value = true
  try {
    const pdfBase64 = await _generatePdfBase64(quote.value).catch(() => undefined)
    await quotesApi.sendEmail(id.value, {
      to:       emailForm.to,
      cc:       emailForm.cc     || undefined,
      subject:  emailForm.subject || undefined,
      message:  emailForm.message || undefined,
      pdfBase64,
    })
    toast.success('Correo enviado con PDF adjunto')
    showEmailModal.value = false
    await load()
  } catch (e: any) {
    toast.error(e?.response?.data?.message ?? 'Error al enviar el correo')
  } finally {
    actionLoading.value = false
  }
}

async function doApprove() {
  if (actionLoading.value) return
  actionLoading.value = true
  try {
    await quotesApi.approve(id.value)
    toast.success('Cotización aprobada')
    await load()
  } catch (e: any) {
    toast.error(e?.response?.data?.message ?? 'Error al aprobar')
  } finally {
    actionLoading.value = false
  }
}

async function doReject() {
  if (actionLoading.value) return
  actionLoading.value = true
  try {
    await quotesApi.reject(id.value, rejectReason.value)
    toast.success('Cotización rechazada')
    showRejectModal.value = false
    rejectReason.value = ''
    await load()
  } catch (e: any) {
    toast.error(e?.response?.data?.message ?? 'Error al rechazar')
  } finally {
    actionLoading.value = false
  }
}

async function doConvert() {
  if (actionLoading.value) return
  actionLoading.value = true
  try {
    const res = await quotesApi.convert(id.value)
    toast.success('Cotización convertida a venta')
    if (res.data?.saleOrderId) {
      router.push(`/sales/${res.data.saleOrderId}`)
    } else {
      await load()
    }
  } catch (e: any) {
    toast.error(e?.response?.data?.message ?? 'Error al convertir')
  } finally {
    actionLoading.value = false
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_FLOW_ORDER = ['DRAFT', 'SENT', 'APPROVED', 'CONVERTED']

const statusFlow = [
  { key: 'DRAFT',     label: 'Borrador' },
  { key: 'SENT',      label: 'Enviada' },
  { key: 'APPROVED',  label: 'Aprobada' },
  { key: 'CONVERTED', label: 'Convertida' },
]

function isStepReached(key: string) {
  if (!quote.value) return false
  const current = quote.value.status
  if (['REJECTED', 'EXPIRED'].includes(current)) {
    // Show up to where it was before rejection
    const idx = STATUS_FLOW_ORDER.indexOf(key)
    const curIdx = STATUS_FLOW_ORDER.indexOf('SENT')
    return idx <= curIdx
  }
  const idx = STATUS_FLOW_ORDER.indexOf(key)
  const curIdx = STATUS_FLOW_ORDER.indexOf(current)
  return idx <= curIdx
}

function statusLabel(s: string) {
  const map: Record<string, string> = {
    DRAFT: 'Borrador', SENT: 'Enviada', APPROVED: 'Aprobada',
    REJECTED: 'Rechazada', EXPIRED: 'Vencida', CONVERTED: 'Convertida',
  }
  return map[s] ?? s
}

function statusBadge(s: string) {
  const map: Record<string, string> = {
    DRAFT:     'badge-gray',
    SENT:      'badge-blue',
    APPROVED:  'badge-green',
    REJECTED:  'badge-red',
    EXPIRED:   'badge-yellow',
    CONVERTED: 'badge-purple',
  }
  return map[s] ?? 'badge-gray'
}

function formatCurrency(v: any) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(v) || 0)
}

function formatDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function isExpiringSoon(d: string) {
  if (!d) return false
  const diff = new Date(d).getTime() - Date.now()
  return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000
}
</script>
