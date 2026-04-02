<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Cotizaciones</h1>
        <p class="text-sm text-slate-400 mt-0.5">Presupuestos y propuestas comerciales</p>
      </div>
      <button class="btn-primary flex items-center gap-2" @click="openCreate">
        <PlusIcon class="w-4 h-4" />
        Nueva Cotización
      </button>
    </div>

    <!-- Stats strip -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <div v-for="s in statusStrip" :key="s.label"
        class="bg-white dark:bg-slate-800 rounded-xl p-3 border border-[#E8EDF2] dark:border-slate-700/70 shadow-card text-center cursor-pointer hover:border-indigo-300 transition-colors"
        @click="filters.status = filters.status === s.value ? '' : s.value">
        <p class="text-2xl font-bold" :class="s.color">{{ s.count }}</p>
        <p class="text-[11px] text-slate-400 mt-0.5 font-medium">{{ s.label }}</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="card">
      <div class="flex flex-wrap gap-3">
        <select v-model="filters.status" class="input w-44">
          <option value="">Todos los estados</option>
          <option value="DRAFT">Borrador</option>
          <option value="SENT">Enviada</option>
          <option value="APPROVED">Aprobada</option>
          <option value="REJECTED">Rechazada</option>
          <option value="EXPIRED">Vencida</option>
          <option value="CONVERTED">Convertida</option>
        </select>
        <select v-model="filters.customerId" class="input w-48">
          <option value="">Todos los clientes</option>
          <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <input v-model="filters.from" type="date" class="input w-40" />
        <span class="text-slate-400 self-center text-sm">al</span>
        <input v-model="filters.to" type="date" class="input w-40" />
      </div>
    </div>

    <!-- Table -->
    <div class="card p-0">
      <DataTable :columns="columns" :data="quotes" :loading="loading" :pagination="pagination" @page-change="onPageChange">
        <template #cell-status="{ value }">
          <span :class="statusBadge(value)">{{ statusLabel(value) }}</span>
        </template>
        <template #cell-validUntil="{ value }">
          <span :class="isExpiringSoon(value) ? 'text-amber-500 font-semibold' : ''">{{ formatDate(value) }}</span>
        </template>
        <template #cell-total="{ value }">
          <span class="font-semibold">{{ formatCurrency(value) }}</span>
        </template>
        <template #cell-actions="{ row }">
          <div class="flex gap-1">
            <RouterLink :to="`/quotes/${row.id}`" class="btn-ghost text-xs px-2 py-1" title="Ver detalle">
              <EyeIcon class="w-3.5 h-3.5" />
            </RouterLink>
            <button class="btn-ghost text-xs px-2 py-1 text-slate-500" title="Descargar PDF" @click="downloadPdf(row)">
              <ArrowDownTrayIcon class="w-3.5 h-3.5" />
            </button>
            <button v-if="row.status === 'DRAFT'" class="btn-ghost text-xs px-2 py-1 text-sky-600" title="Enviar al cliente" @click="doSend(row)">
              <PaperAirplaneIcon class="w-3.5 h-3.5" />
            </button>
            <button v-if="row.status === 'SENT'" class="btn-ghost text-xs px-2 py-1 text-emerald-600" title="Aprobar" @click="doApprove(row)">
              <CheckCircleIcon class="w-3.5 h-3.5" />
            </button>
            <button v-if="row.status === 'APPROVED'" class="btn-ghost text-xs px-2 py-1 text-indigo-600" title="Convertir a venta" @click="doConvert(row)">
              <ArrowRightCircleIcon class="w-3.5 h-3.5" />
            </button>
            <button v-if="['SENT','APPROVED'].includes(row.status)" class="btn-ghost text-xs px-2 py-1 text-red-500" title="Rechazar" @click="openReject(row)">
              <XCircleIcon class="w-3.5 h-3.5" />
            </button>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- CREATE MODAL -->
    <AppModal v-model="showCreate" title="Nueva Cotización" size="xl">
      <form @submit.prevent="submitCreate" class="space-y-5">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Cliente <span class="text-red-500">*</span></label>
            <select v-model="form.customerId" class="input" required>
              <option value="">— Selecciona cliente —</option>
              <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div>
            <label class="label">Válida hasta <span class="text-slate-400 text-xs">(opcional)</span></label>
            <input v-model="form.validUntil" type="date" class="input" />
          </div>
        </div>
        <div>
          <label class="label">Notas <span class="text-slate-400 text-xs">(opcional)</span></label>
          <textarea v-model="form.notes" rows="2" class="input" placeholder="Condiciones, aclaraciones..."></textarea>
        </div>

        <!-- Items -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="label mb-0 font-semibold">Artículos <span class="text-red-500">*</span></label>
            <button type="button" class="btn-ghost text-xs flex items-center gap-1" @click="addItem">
              <PlusIcon class="w-3.5 h-3.5" /> Agregar línea
            </button>
          </div>
          <div class="hidden md:grid grid-cols-12 gap-2 text-xs font-medium text-slate-400 uppercase tracking-wide px-1 mb-1">
            <div class="col-span-4">Producto *</div>
            <div class="col-span-2 text-center">Cantidad *</div>
            <div class="col-span-2">Precio Unit. *</div>
            <div class="col-span-1 text-center">Dto%</div>
            <div class="col-span-2 text-right">Subtotal</div>
            <div class="col-span-1"></div>
          </div>
          <div class="space-y-2">
            <div v-for="(item, idx) in form.items" :key="idx"
              class="grid grid-cols-12 gap-2 items-center bg-[#F8FAFC] dark:bg-slate-800/50 rounded-lg p-2 border border-transparent">
              <div class="col-span-4">
                <select v-model="item.productId" class="input text-sm" @change="onProductSelect(item)">
                  <option value="">— Producto —</option>
                  <option v-for="p in products" :key="p.id" :value="p.id">{{ p.code }} — {{ p.name }}</option>
                </select>
              </div>
              <div class="col-span-2">
                <input v-model.number="item.quantity" type="number" min="0.01" step="0.01" class="input text-sm text-center" placeholder="1" />
              </div>
              <div class="col-span-2">
                <input v-model.number="item.unitPrice" type="number" min="0" step="0.01" class="input text-sm" placeholder="0.00" />
              </div>
              <div class="col-span-1">
                <input v-model.number="item.discount" type="number" min="0" max="100" step="0.1" class="input text-sm text-center" placeholder="0" />
              </div>
              <div class="col-span-2 text-right text-sm font-semibold text-slate-700 dark:text-slate-200">
                {{ formatCurrency(lineTotal(item)) }}
              </div>
              <button type="button" class="col-span-1 btn-ghost p-1.5 text-red-400 hover:text-red-600 flex justify-center" @click="removeItem(idx)" :disabled="form.items.length === 1">
                <XMarkIcon class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- Totals -->
        <div class="bg-[#F8FAFC] dark:bg-slate-800 rounded-xl p-4 text-sm space-y-1.5 border border-[#E8EDF2] dark:border-slate-700">
          <div class="flex justify-between text-slate-500"><span>Subtotal</span><span>{{ formatCurrency(formSubtotal) }}</span></div>
          <div class="flex justify-between text-slate-500"><span>IVA (16%)</span><span>{{ formatCurrency(formTax) }}</span></div>
          <div class="flex justify-between font-bold text-base border-t border-[#E8EDF2] dark:border-slate-600 pt-2 text-slate-800 dark:text-white">
            <span>Total</span><span>{{ formatCurrency(formTotal) }}</span>
          </div>
        </div>
      </form>
      <template #footer>
        <button class="btn-secondary" @click="showCreate = false">Cancelar</button>
        <button class="btn-primary" :disabled="saving" @click="submitCreate">
          {{ saving ? 'Creando...' : 'Crear Cotización' }}
        </button>
      </template>
    </AppModal>

    <!-- REJECT MODAL -->
    <AppModal v-model="showReject" title="Rechazar Cotización" size="sm">
      <div class="space-y-3">
        <p class="text-sm text-slate-600 dark:text-slate-300">Cotización <strong>{{ rejectingItem?.folio }}</strong></p>
        <div>
          <label class="label">Motivo de rechazo <span class="text-slate-400 text-xs">(opcional)</span></label>
          <textarea v-model="rejectReason" rows="3" class="input" placeholder="Ej: Precio fuera de presupuesto, plazo de entrega..."></textarea>
        </div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="showReject = false">Cancelar</button>
        <button class="btn-danger" :disabled="saving" @click="submitReject">Rechazar</button>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useToast } from 'vue-toastification'
import { quotesApi, customersApi, productsApi } from '@/services/api'
import {
  PlusIcon, EyeIcon, CheckCircleIcon, XCircleIcon, XMarkIcon,
  PaperAirplaneIcon, ArrowRightCircleIcon, ArrowDownTrayIcon,
} from '@heroicons/vue/24/outline'
import DataTable from '@/components/ui/DataTable.vue'
import AppModal from '@/components/ui/AppModal.vue'
import { useQuotePdf } from '@/composables/useQuotePdf'

const { generate: generatePdf } = useQuotePdf()
const toast      = useToast()
const loading    = ref(false)
const saving     = ref(false)
const quotes     = ref([])
const customers  = ref([])
const products   = ref([])
const showCreate = ref(false)
const showReject = ref(false)
const rejectingItem = ref(null)
const rejectReason  = ref('')

const pagination = reactive({ page: 1, limit: 20, total: 0 })
const filters    = reactive({ status: '', customerId: '', from: '', to: '' })

const defaultItem = () => ({ productId: '', quantity: 1, unitPrice: 0, discount: 0 })
const form = reactive({ customerId: '', validUntil: '', notes: '', items: [defaultItem()] })

const columns = [
  { key: 'folio',      label: 'Folio',     sortable: true },
  { key: 'createdAt',  label: 'Fecha',     sortable: true },
  { key: 'customerName', label: 'Cliente'  },
  { key: 'itemCount',  label: 'Artículos'  },
  { key: 'validUntil', label: 'Válida hasta' },
  { key: 'total',      label: 'Total'      },
  { key: 'status',     label: 'Estado'     },
  { key: 'actions',    label: ''           },
]

// Status strip counts
const statusStrip = computed(() => [
  { label: 'Borradores', value: 'DRAFT',     count: quotes.value.filter(q => q.status === 'DRAFT').length,     color: 'text-slate-500' },
  { label: 'Enviadas',   value: 'SENT',      count: quotes.value.filter(q => q.status === 'SENT').length,      color: 'text-sky-500'   },
  { label: 'Aprobadas',  value: 'APPROVED',  count: quotes.value.filter(q => q.status === 'APPROVED').length,  color: 'text-emerald-500'},
  { label: 'Rechazadas', value: 'REJECTED',  count: quotes.value.filter(q => q.status === 'REJECTED').length,  color: 'text-red-500'   },
  { label: 'Vencidas',   value: 'EXPIRED',   count: quotes.value.filter(q => q.status === 'EXPIRED').length,   color: 'text-amber-500' },
  { label: 'Convertidas',value: 'CONVERTED', count: quotes.value.filter(q => q.status === 'CONVERTED').length, color: 'text-indigo-500' },
])

const lineTotal  = item => (item.quantity || 0) * (item.unitPrice || 0) * (1 - (item.discount || 0) / 100)
const formSubtotal = computed(() => form.items.reduce((s, i) => s + lineTotal(i), 0))
const formTax      = computed(() => formSubtotal.value * 0.16)
const formTotal    = computed(() => formSubtotal.value + formTax.value)

function statusBadge(s) {
  const m = { DRAFT: 'badge-gray', SENT: 'badge-blue', APPROVED: 'badge-green', REJECTED: 'badge-red', EXPIRED: 'badge-amber', CONVERTED: 'badge-blue' }
  return m[s] || 'badge-gray'
}
function statusLabel(s) {
  const m = { DRAFT: 'Borrador', SENT: 'Enviada', APPROVED: 'Aprobada', REJECTED: 'Rechazada', EXPIRED: 'Vencida', CONVERTED: 'Convertida' }
  return m[s] || s
}
function formatDate(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }) }
function formatCurrency(v) { return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v || 0) }
function isExpiringSoon(d) {
  if (!d) return false
  const diff = (new Date(d) - new Date()) / (1000 * 60 * 60 * 24)
  return diff >= 0 && diff <= 3
}

function onProductSelect(item) {
  const p = products.value.find(p => p.id === item.productId)
  if (p) item.unitPrice = Number(p.salePrice) || 0
}
function addItem()       { form.items.push(defaultItem()) }
function removeItem(idx) { if (form.items.length > 1) form.items.splice(idx, 1) }

function openCreate() {
  Object.assign(form, { customerId: '', validUntil: '', notes: '', items: [defaultItem()] })
  showCreate.value = true
}
function openReject(row) { rejectingItem.value = row; rejectReason.value = ''; showReject.value = true }

async function submitCreate() {
  if (!form.customerId || form.items.some(i => !i.productId || !i.quantity)) {
    toast.warning('Completa todos los campos requeridos')
    return
  }
  saving.value = true
  try {
    await quotesApi.create({
      customerId: form.customerId,
      validUntil: form.validUntil || undefined,
      notes:      form.notes || undefined,
      items:      form.items.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice, discount: i.discount || 0 })),
    })
    toast.success('Cotización creada')
    showCreate.value = false
    fetchQuotes()
  } catch (err) { toast.error(err?.response?.data?.message || 'Error al crear cotización') }
  finally { saving.value = false }
}

async function downloadPdf(row: any) {
  try {
    const res = await quotesApi.get(row.id)
    await generatePdf(res.data)
  } catch { toast.error('Error al generar PDF') }
}

async function doSend(row) {
  try { await quotesApi.send(row.id); toast.success('Cotización enviada al cliente'); fetchQuotes() }
  catch (err) { toast.error(err?.response?.data?.message || 'Error al enviar') }
}
async function doApprove(row) {
  try { await quotesApi.approve(row.id); toast.success('Cotización aprobada'); fetchQuotes() }
  catch (err) { toast.error(err?.response?.data?.message || 'Error al aprobar') }
}
async function doConvert(row) {
  try {
    const res = await quotesApi.convert(row.id)
    toast.success(`Venta ${res.data.saleOrder?.folio} creada desde cotización`)
    fetchQuotes()
  } catch (err) { toast.error(err?.response?.data?.message || 'Error al convertir') }
}
async function submitReject() {
  saving.value = true
  try {
    await quotesApi.reject(rejectingItem.value.id, rejectReason.value || undefined)
    toast.success('Cotización rechazada')
    showReject.value = false
    fetchQuotes()
  } catch (err) { toast.error(err?.response?.data?.message || 'Error al rechazar') }
  finally { saving.value = false }
}

async function fetchQuotes() {
  loading.value = true
  try {
    const res = await quotesApi.list({
      page: pagination.page, limit: pagination.limit,
      status: filters.status || undefined,
      customerId: filters.customerId || undefined,
      from: filters.from || undefined,
      to:   filters.to   || undefined,
    })
    const raw = res.data.data || []
    quotes.value = raw.map(q => ({
      ...q,
      customerName: q.customer?.name ?? '—',
      itemCount:    q._count?.items ?? q.items?.length ?? 0,
      createdAt:    q.createdAt,
    }))
    pagination.total = res.data.meta?.total ?? 0
  } catch { toast.error('Error al cargar cotizaciones') }
  finally { loading.value = false }
}

function onPageChange(p) { pagination.page = p; fetchQuotes() }
watch(filters, () => { pagination.page = 1; fetchQuotes() })

onMounted(async () => {
  const [cRes, pRes] = await Promise.all([
    customersApi.list({ limit: 500 }),
    productsApi.list({ limit: 500, isActive: 'true' }),
  ])
  customers.value = cRes.data.data || cRes.data.items || []
  products.value  = pRes.data.data || pRes.data.items || []
  fetchQuotes()
})
</script>
