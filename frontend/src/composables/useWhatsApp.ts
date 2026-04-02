/**
 * Opens WhatsApp Web/Mobile with a pre-filled message via wa.me link.
 * Works without any API key — the user just clicks Send in WhatsApp.
 */

function cleanPhone(raw: string): string {
  // Remove everything except digits
  let digits = raw.replace(/\D/g, '')
  // Mexico: 10-digit numbers → prepend country code 52
  if (digits.length === 10) digits = '52' + digits
  // Remove leading 0 if present after country code
  if (digits.startsWith('520')) digits = '52' + digits.slice(3)
  return digits
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const number = cleanPhone(phone)
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}

export function sendWhatsApp(phone: string, message: string): void {
  const url = buildWhatsAppUrl(phone, message)
  window.open(url, '_blank', 'noopener,noreferrer')
}

export function buildQuoteMessage(quote: any): string {
  const fmt = (v: any) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(v) || 0)

  const items = (quote.items ?? [])
    .map((i: any) => `  • ${i.product?.name ?? ''} x${Number(i.quantity)} — ${fmt(i.unitPrice)}`)
    .join('\n')

  return `Hola ${quote.customer?.name ?? ''},

Le comparto nuestra *Cotización ${quote.folio}* 📋

*Artículos:*
${items}

*Subtotal:* ${fmt(quote.subtotal)}
*IVA 16%:* ${fmt(quote.tax)}
*Total:* ${fmt(quote.total)}

${quote.validUntil ? `Válida hasta: ${new Date(quote.validUntil).toLocaleDateString('es-MX')}\n` : ''}Quedamos a sus órdenes para cualquier aclaración.

*CALUTEC* — www.calutec.com`
}
