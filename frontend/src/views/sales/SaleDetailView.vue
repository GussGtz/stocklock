<template>
  <div class="space-y-6">
    <!-- Back + Header -->
    <div class="page-header">
      <div class="flex items-center gap-4">
        <button class="btn-ghost p-2 rounded-lg" @click="$router.push('/sales')">
          <ArrowLeftIcon class="w-5 h-5" />
        </button>
        <div>
          <div class="flex items-center gap-3">
            <h1 class="page-title">{{ sale?.folio || 'Cargando...' }}</h1>
            <span v-if="sale" :class="statusBadge(sale.status)">{{ statusLabel(sale.status) }}</span>
            <span v-if="sale?.cfdiStatus === 'VIGENTE'" class="badge-green flex items-center gap-1">
              <DocumentCheckIcon class="w-3.5 h-3.5" />
              CFDI Vigente
            </span>
            <span v-else-if="sale?.cfdiStatus === 'CANCELADO'" class="badge-red flex items-center gap-1">
              <XCircleIcon class="w-3.5 h-3.5" />
              CFDI Cancelado
            </span>
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Orden de venta</p>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="flex gap-2 flex-wrap">
        <button
          v-if="sale?.status === 'DRAFT'"
          class="btn-primary flex items-center gap-2"
          @click="confirmSale"
        >
          <CheckCircleIcon class="w-4 h-4" />
          Confirmar
        </button>
        <button
          v-if="sale?.status === 'CONFIRMED'"
          class="btn-primary flex items-center gap-2"
          @click="deliverSale"
        >
          <TruckIcon class="w-4 h-4" />
          Marcar Entregado
        </button>

        <!-- Generate CFDI -->
        <button
          v-if="canInvoice"
          class="btn-primary flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
          :disabled="invoiceLoading"
          @click="showInvoiceModal = true"
        >
          <DocumentTextIcon class="w-4 h-4" />
          {{ invoiceLoading ? 'Timbrando...' : 'Generar Factura CFDI' }}
        </button>

        <!-- Cancel CFDI -->
        <button
          v-if="sale?.cfdiStatus === 'VIGENTE'"
          class="btn-secondary flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
          @click="showCancelCfdiModal = true"
        >
          <XCircleIcon class="w-4 h-4" />
          Cancelar CFDI
        </button>

        <button
          v-if="!['DELIVERED', 'INVOICED', 'CANCELLED'].includes(sale?.status)"
          class="btn-danger flex items-center gap-2"
          @click="showCancelConfirm = true"
        >
          <XCircleIcon class="w-4 h-4" />
          Cancelar
        </button>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-pulse">
      <div class="card lg:col-span-2"><div class="space-y-3"><div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div></div></div>
      <div class="card"><div class="space-y-3"><div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div></div></div>
    </div>

    <template v-else-if="sale">
      <!-- Info cards -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div class="card lg:col-span-2">
          <h3 class="font-semibold text-gray-900 dark:text-white mb-3">Información del Cliente</h3>
          <div class="grid grid-cols-2 gap-y-2 text-sm">
            <span class="text-gray-500 dark:text-gray-400">Cliente</span>
            <span class="font-medium">{{ sale.customer?.name ?? sale.customerName }}</span>
            <span class="text-gray-500 dark:text-gray-400">RFC</span>
            <span>{{ sale.customer?.rfc ?? '—' }}</span>
            <span class="text-gray-500 dark:text-gray-400">Régimen Fiscal</span>
            <span>{{ sale.customer?.regimenFiscal ?? '—' }}</span>
            <span class="text-gray-500 dark:text-gray-400">CP Fiscal</span>
            <span>{{ sale.customer?.zipCode ?? '—' }}</span>
            <span class="text-gray-500 dark:text-gray-400">Uso CFDI</span>
            <span>{{ sale.customer?.usoCfdiDefault ?? '—' }}</span>
            <span class="text-gray-500 dark:text-gray-400">Notas</span>
            <span>{{ sale.notes || '—' }}</span>
          </div>
        </div>

        <div class="card">
          <h3 class="font-semibold text-gray-900 dark:text-white mb-3">Fechas y Totales</h3>
          <div class="space-y-2 text-sm mb-4">
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">Creada</span>
              <span>{{ formatDate(sale.createdAt) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">Entrega</span>
              <span>{{ formatDate(sale.deliveryDate) }}</span>
            </div>
          </div>
          <div class="border-t border-gray-100 dark:border-gray-700 pt-3 space-y-1 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">Subtotal</span>
              <span>{{ formatCurrency(sale.subtotal) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">Descuento</span>
              <span class="text-red-500">-{{ formatCurrency(sale.discount) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">IVA 16%</span>
              <span>{{ formatCurrency(sale.tax) }}</span>
            </div>
            <div class="flex justify-between font-bold text-base border-t border-gray-200 dark:border-gray-600 pt-1 mt-1">
              <span>Total</span>
              <span>{{ formatCurrency(sale.total) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── CFDI Info Panel ── -->
      <div v-if="sale.cfdiUuid" class="card border-l-4"
           :class="sale.cfdiStatus === 'VIGENTE' ? 'border-emerald-500' : 'border-red-400'">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <DocumentTextIcon class="w-5 h-5 text-emerald-500" />
              Factura Electrónica CFDI 4.0
            </h3>
            <div class="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <span class="text-gray-500 dark:text-gray-400">UUID (Folio Fiscal)</span>
              <span class="font-mono text-xs text-slate-800 dark:text-gray-200 break-all">{{ sale.cfdiUuid }}</span>
              <span class="text-gray-500 dark:text-gray-400">No. Factura</span>
              <span class="font-medium">{{ sale.invoiceNo || '—' }}</span>
              <span class="text-gray-500 dark:text-gray-400">Estado SAT</span>
              <span :class="sale.cfdiStatus === 'VIGENTE' ? 'badge-green' : 'badge-red'">
                {{ sale.cfdiStatus }}
              </span>
            </div>
          </div>

          <!-- Download / Email actions -->
          <div class="flex flex-col gap-2 flex-shrink-0">
            <a
              v-if="sale.cfdiXmlUrl"
              :href="sale.cfdiXmlUrl"
              target="_blank"
              class="btn-secondary text-xs flex items-center gap-1.5"
            >
              <ArrowDownTrayIcon class="w-3.5 h-3.5" />
              XML
            </a>
            <a
              v-if="sale.cfdiPdfUrl"
              :href="sale.cfdiPdfUrl"
              target="_blank"
              class="btn-secondary text-xs flex items-center gap-1.5"
            >
              <ArrowDownTrayIcon class="w-3.5 h-3.5" />
              PDF
            </a>
            <button
              class="btn-ghost text-xs flex items-center gap-1.5"
              @click="showEmailModal = true"
            >
              <PaperAirplaneIcon class="w-3.5 h-3.5" />
              Enviar
            </button>
          </div>
        </div>
      </div>

      <!-- Items Table -->
      <div class="card p-0">
        <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 class="font-semibold text-gray-900 dark:text-white">Artículos</h3>
        </div>
        <DataTable :columns="itemColumns" :data="saleItems" :loading="false">
          <template #cell-unitPrice="{ value }">{{ formatCurrency(value) }}</template>
          <template #cell-discount="{ value }">
            <span v-if="value">{{ value }}%</span>
            <span v-else class="text-gray-300 dark:text-gray-600">—</span>
          </template>
          <template #cell-subtotal="{ row }">{{ formatCurrency(itemSubtotal(row)) }}</template>
        </DataTable>
      </div>
    </template>

    <!-- ══ GENERATE CFDI MODAL ══ -->
    <AppModal v-model="showInvoiceModal" title="Generar Factura CFDI 4.0" size="md">
      <div class="space-y-4">
        <!-- Summary -->
        <div class="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 text-sm border border-emerald-200 dark:border-emerald-700">
          <div class="grid grid-cols-2 gap-y-1.5">
            <span class="text-gray-600 dark:text-gray-400">Cliente</span>
            <span class="font-medium">{{ sale?.customer?.name }}</span>
            <span class="text-gray-600 dark:text-gray-400">RFC</span>
            <span class="font-mono">{{ sale?.customer?.rfc || 'XAXX010101000' }}</span>
            <span class="text-gray-600 dark:text-gray-400">Total</span>
            <span class="font-bold text-base">{{ formatCurrency(sale?.total) }}</span>
          </div>
        </div>

        <!-- Método de pago -->
        <div>
          <label class="label">Método de Pago</label>
          <select v-model="invoiceForm.metodoPago" class="input">
            <option value="PUE">PUE – Pago en una sola exhibición</option>
            <option value="PPD">PPD – Pago en parcialidades o diferido</option>
          </select>
        </div>

        <!-- Forma de pago (override) -->
        <div>
          <label class="label">Forma de Pago <span class="text-gray-400 text-xs">(se usará la configurada por defecto si se omite)</span></label>
          <select v-model="invoiceForm.formaPagoCode" class="input">
            <option value="">— Usar default de configuración —</option>
            <option value="01">01 – Efectivo</option>
            <option value="03">03 – Transferencia electrónica</option>
            <option value="04">04 – Tarjeta de crédito</option>
            <option value="28">28 – Tarjeta de débito</option>
            <option value="99">99 – Por definir</option>
          </select>
        </div>

        <!-- Uso CFDI override -->
        <div>
          <label class="label">Uso CFDI del Receptor</label>
          <select v-model="invoiceForm.usoCfdi" class="input">
            <option value="">— Usar el configurado en el cliente —</option>
            <option value="G01">G01 – Adquisición de mercancias</option>
            <option value="G03">G03 – Gastos en general</option>
            <option value="I01">I01 – Construcciones</option>
            <option value="I04">I04 – Equipo de cómputo y accesorios</option>
            <option value="S01">S01 – Sin efectos fiscales</option>
          </select>
        </div>

        <p class="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1.5">
          <span class="mt-0.5">⚠️</span>
          Esta acción enviará la factura al SAT. Verifica los datos antes de continuar.
          Una vez timbrada, solo se puede cancelar siguiendo el proceso del SAT.
        </p>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="showInvoiceModal = false">Cancelar</button>
        <button
          class="btn-primary bg-emerald-600 hover:bg-emerald-700"
          :disabled="invoiceLoading"
          @click="generateInvoice"
        >
          <DocumentTextIcon class="w-4 h-4" />
          {{ invoiceLoading ? 'Timbrado...' : 'Timbrar CFDI' }}
        </button>
      </template>
    </AppModal>

    <!-- ══ CANCEL CFDI MODAL ══ -->
    <AppModal v-model="showCancelCfdiModal" title="Cancelar Factura CFDI" size="sm">
      <div class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Selecciona el motivo de cancelación según el catálogo SAT. Esta acción es irreversible.
        </p>
        <div>
          <label class="label">Motivo de Cancelación *</label>
          <select v-model="cancelCfdiForm.motivo" class="input" required>
            <option value="">— Selecciona —</option>
            <option value="01">01 – Comprobante emitido con errores con relación</option>
            <option value="02">02 – Comprobante emitido con errores sin relación</option>
            <option value="03">03 – No se llevó a cabo la operación</option>
            <option value="04">04 – Operación nominativa relacionada en una factura global</option>
          </select>
        </div>
        <div v-if="cancelCfdiForm.motivo === '01'">
          <label class="label">UUID de Sustitución *</label>
          <input v-model="cancelCfdiForm.uuidSustitucion" class="input font-mono text-sm" placeholder="UUID del CFDI que lo sustituye" />
        </div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="showCancelCfdiModal = false">Cerrar</button>
        <button
          class="btn-danger"
          :disabled="!cancelCfdiForm.motivo || cancelLoading"
          @click="cancelCfdi"
        >
          {{ cancelLoading ? 'Cancelando...' : 'Cancelar CFDI' }}
        </button>
      </template>
    </AppModal>

    <!-- ══ EMAIL CFDI MODAL ══ -->
    <AppModal v-model="showEmailModal" title="Enviar Factura por Correo" size="sm">
      <div class="space-y-4">
        <p class="text-sm text-gray-500">Se enviará el XML y PDF de la factura al correo indicado.</p>
        <div>
          <label class="label">Correo electrónico *</label>
          <input
            v-model="emailTo"
            type="email"
            class="input"
            placeholder="destinatario@empresa.com"
          />
        </div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="showEmailModal = false">Cancelar</button>
        <button class="btn-primary" :disabled="!emailTo || emailLoading" @click="sendEmail">
          <PaperAirplaneIcon class="w-4 h-4" />
          {{ emailLoading ? 'Enviando...' : 'Enviar' }}
        </button>
      </template>
    </AppModal>

    <!-- Cancel order confirm -->
    <ConfirmModal
      v-model="showCancelConfirm"
      title="Cancelar Venta"
      :message="`¿Cancelar la orden ${sale?.folio}?`"
      confirm-text="Sí, cancelar"
      variant="danger"
      @confirm="cancelOrder"
    />
  </div>
</template>

<script setup>
import { salesApi, cfdiApi } from '@/services/api'
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import {
  ArrowLeftIcon, CheckCircleIcon, TruckIcon, XCircleIcon,
  DocumentTextIcon, DocumentCheckIcon, ArrowDownTrayIcon, PaperAirplaneIcon,
} from '@heroicons/vue/24/outline'
import DataTable from '@/components/ui/DataTable.vue'
import AppModal from '@/components/ui/AppModal.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const loading = ref(false)
const sale = ref(null)
const showCancelConfirm = ref(false)
const showInvoiceModal = ref(false)
const showCancelCfdiModal = ref(false)
const showEmailModal = ref(false)
const invoiceLoading = ref(false)
const cancelLoading = ref(false)
const emailLoading = ref(false)
const emailTo = ref('')

const invoiceForm = ref({ metodoPago: 'PUE', formaPagoCode: '', usoCfdi: '' })
const cancelCfdiForm = ref({ motivo: '', uuidSustitucion: '' })

// Can generate CFDI when order is CONFIRMED or DELIVERED and no CFDI yet
const canInvoice = computed(() =>
  sale.value &&
  ['CONFIRMED', 'DELIVERED'].includes(sale.value.status) &&
  !sale.value.cfdiUuid,
)

const saleItems = computed(() =>
  (sale.value?.items ?? []).map(item => ({
    ...item,
    productCode: item.product?.code ?? item.productCode ?? '—',
    productName: item.product?.name ?? item.productName ?? '—',
    qty: Number(item.quantity),
    unitPrice: Number(item.unitPrice),
    discount: Number(item.discount),
  }))
)

const itemColumns = [
  { key: 'productCode', label: 'Código' },
  { key: 'productName', label: 'Producto' },
  { key: 'qty', label: 'Cantidad' },
  { key: 'unitPrice', label: 'Precio Unit.' },
  { key: 'discount', label: 'Desc. %' },
  { key: 'subtotal', label: 'Subtotal' },
]

function itemSubtotal(item) {
  const base = (item.qty || 0) * (item.unitPrice || 0)
  return base - base * ((item.discount || 0) / 100)
}

function statusBadge(s) {
  const m = { DRAFT: 'badge-gray', CONFIRMED: 'badge-blue', PARTIAL: 'badge-amber', DELIVERED: 'badge-green', INVOICED: 'badge-blue', CANCELLED: 'badge-red' }
  return m[s] || 'badge-gray'
}

function statusLabel(s) {
  const m = { DRAFT: 'Borrador', CONFIRMED: 'Confirmado', PARTIAL: 'Parcial', DELIVERED: 'Entregado', INVOICED: 'Facturado', CANCELLED: 'Cancelado' }
  return m[s] || s
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatCurrency(v) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v || 0)
}

// ── Sale actions ───────────────────────────────────────────────────────

async function confirmSale() {
  try {
    await salesApi.confirm(route.params.id)
    toast.success('Venta confirmada')
    fetchSale()
  } catch (err) {
    toast.error('Error al confirmar venta')
  }
}

async function deliverSale() {
  try {
    await salesApi.deliver(route.params.id)
    toast.success('Venta marcada como entregada')
    fetchSale()
  } catch (err) {
    toast.error('Error al marcar entrega')
  }
}

async function cancelOrder() {
  try {
    await salesApi.cancel(route.params.id)
    toast.success('Venta cancelada')
    fetchSale()
  } catch (err) {
    toast.error('Error al cancelar')
  }
}

// ── CFDI actions ───────────────────────────────────────────────────────

async function generateInvoice() {
  invoiceLoading.value = true
  try {
    const payload = { metodoPago: invoiceForm.value.metodoPago }
    if (invoiceForm.value.usoCfdi) payload.usoCfdi = invoiceForm.value.usoCfdi
    // Map formaPagoCode to idFormaPago is handled server-side via config
    // but we can pass the formaPago string description
    if (invoiceForm.value.formaPagoCode) {
      const labels = {
        '01': '01 Efectivo',
        '03': '03 Transferencia electrónica de fondos',
        '04': '04 Tarjeta de crédito',
        '28': '28 Tarjeta de débito',
        '99': '99 Por definir',
      }
      payload.formaPago = labels[invoiceForm.value.formaPagoCode] || ''
    }
    const res = await cfdiApi.generateInvoice(route.params.id, payload)
    toast.success(`✅ Factura timbrada — UUID: ${res.data.uuid}`)
    showInvoiceModal.value = false
    fetchSale()
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Error al generar factura CFDI')
  } finally {
    invoiceLoading.value = false
  }
}

async function cancelCfdi() {
  if (!cancelCfdiForm.value.motivo) return
  cancelLoading.value = true
  try {
    await cfdiApi.cancelInvoice(route.params.id, {
      motivo: cancelCfdiForm.value.motivo,
      uuidSustitucion: cancelCfdiForm.value.uuidSustitucion || undefined,
    })
    toast.success('Factura CFDI cancelada')
    showCancelCfdiModal.value = false
    fetchSale()
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Error al cancelar CFDI')
  } finally {
    cancelLoading.value = false
  }
}

async function sendEmail() {
  emailLoading.value = true
  try {
    await cfdiApi.emailInvoice(route.params.id, emailTo.value)
    toast.success(`Factura enviada a ${emailTo.value}`)
    showEmailModal.value = false
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Error al enviar correo')
  } finally {
    emailLoading.value = false
  }
}

// ── Fetch ──────────────────────────────────────────────────────────────

async function fetchSale() {
  loading.value = true
  try {
    const res = await salesApi.get(route.params.id)
    sale.value = res.data
    // Pre-fill email from customer
    if (!emailTo.value && res.data?.customer?.email) {
      emailTo.value = res.data.customer.email
    }
  } catch {
    toast.error('Error al cargar orden de venta')
  } finally {
    loading.value = false
  }
}

onMounted(fetchSale)
</script>
