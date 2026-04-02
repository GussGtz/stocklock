import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import companyLogoUrl from '@/assets/company_logo.png'

// ─── Company config ────────────────────────────────────────────────────────────
const COMPANY = {
  name:        'CALUTEC SA DE CV',
  shortName:   'CALUTEC',
  tagline:     'QUALITY TECHNICAL ALUMINUM',
  website:     'www.calutec.com',
  email:       'contacto@calutec.com',
  phone:       '998 394 1625',
  city:        'Cancún, Quintana Roo.',
  tableTitle:  'PRESUPUESTO GENERAL DE CANCELERÍA',
  bankName:    'BANCO BBVA',
  bankHolder:  'CALUTEC SA DE CV',
  bankClabe:   '012691001252133121',
  bankAccount: '0125213312',
  anticipo:    40,
  vigencia:    '15 DÍAS',
  conditions:
    'No se considera pago de impuestos, SIROC y REPSE. Si se requiere Siroc, será adicionar al precio actual. ' +
    'No se consideran ayudas de albañilería ni permisos de obra. No se consideran partidas de seguridad ni de limpieza. ' +
    'No se consideran partidas de servicios de electricidad, agua ni servicios higiénicos. No se consideran ayudas de medios ' +
    'auxiliares necesarios para el montaje en obra (andamios, plataformas elevadoras, grúas, etc.), que serán por cuenta del cliente. ' +
    'El cliente se compromete a tener las condiciones adecuadas para la correcta instalación de la cancelería, de modo que pueda ' +
    'realizarse con total garantía de acabados. En caso de que la instalación se realice sobre obra gris, o cuando las condiciones ' +
    'de la obra no sean las recomendadas por el instalador, se exime de responsabilidad al instalador por daños ocasionados al ' +
    'material después de la instalación. El instalador (Calutec) tendrá la reserva de dominio de la instalación y es propietario ' +
    'de ésta, hasta que el cliente haya satisfecho el pago total de la misma.\n\n' +
    'No se hacen trabajos de: albañilería, resanes, instalaciones eléctricas ni carpintería.',
}

// ─── Color palette ────────────────────────────────────────────────────────────
const NAVY:      [number, number, number] = [33,  62,  103]
const NAVY_DARK: [number, number, number] = [24,  48,  84]
const WHITE:     [number, number, number] = [255, 255, 255]
const LGRAY:     [number, number, number] = [234, 240, 248]
const MGRAY:     [number, number, number] = [195, 210, 232]
const BLACK:     [number, number, number] = [28,  28,  28]
const BLUE_LINK: [number, number, number] = [0,   90,  200]
const BORDER_C:  [number, number, number] = [168, 184, 214]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(v: any) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(v) || 0)
}

function fmtDate(d: string) {
  if (!d) return '—'
  const dt = new Date(d)
  return dt.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()
}

function numToWords(n: number): string {
  if (n === 0) return 'CERO'
  if (n < 0)   return 'MENOS ' + numToWords(-n)

  const UNIDADES = [
    '', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE',
    'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE',
    'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE',
  ]
  const DECENAS  = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA']
  const CENTENAS = ['', 'CIEN', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS']

  function chunk(x: number): string {
    if (x === 0)   return ''
    if (x < 20)    return UNIDADES[x]
    if (x < 100) {
      const d = Math.floor(x / 10), u = x % 10
      if (u === 0) return DECENAS[d]
      if (d === 2) return 'VEINTI' + UNIDADES[u]
      return DECENAS[d] + ' Y ' + UNIDADES[u]
    }
    const c = Math.floor(x / 100), r = x % 100
    if (r === 0) return x === 100 ? 'CIEN' : CENTENAS[c]
    return CENTENAS[c] + ' ' + chunk(r)
  }

  if (n < 1000)       return chunk(n)
  if (n < 1_000_000) {
    const m = Math.floor(n / 1000), r = n % 1000
    const ms = m === 1 ? 'MIL' : chunk(m) + ' MIL'
    return r === 0 ? ms : ms + ' ' + chunk(r)
  }
  if (n < 1_000_000_000) {
    const m = Math.floor(n / 1_000_000), r = n % 1_000_000
    const ms = m === 1 ? 'UN MILLÓN' : chunk(m) + ' MILLONES'
    return r === 0 ? ms : ms + ' ' + numToWords(r)
  }
  return n.toLocaleString()
}

// Load image helper
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload  = () => resolve(img)
    img.onerror = reject
    img.src     = src
  })
}

// Draw a filled+bordered cell
function cell(
  doc: jsPDF,
  x: number, y: number, w: number, h: number,
  fill: [number, number, number],
  border = true,
) {
  doc.setFillColor(...fill)
  doc.setDrawColor(...BORDER_C)
  doc.setLineWidth(0.2)
  doc.rect(x, y, w, h, border ? 'FD' : 'F')
}

// Draw centered text
function tc(
  doc: jsPDF,
  text: string, cx: number, cy: number,
  fontSize: number, bold: boolean, color: [number, number, number],
) {
  doc.setFont('helvetica', bold ? 'bold' : 'normal')
  doc.setFontSize(fontSize)
  doc.setTextColor(...color)
  doc.text(text, cx, cy, { align: 'center', baseline: 'middle' })
}

// ─────────────────────────────────────────────────────────────────────────────
export function useQuotePdf() {
  async function generate(quote: any) {
    // Pre-load company logo
    const logoImg = await loadImage(companyLogoUrl as string)

    const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })
    const W    = doc.internal.pageSize.getWidth()   // 215.9 mm
    const H    = doc.internal.pageSize.getHeight()  // 279.4 mm
    const ML   = 14
    const MR   = 14
    const CW   = W - ML - MR  // 187.9 mm
    let y      = 13

    // ── Column geometry (reused for header + autoTable) ──────────────────────
    const COL = {
      clave:    { x: ML,        w: 18   },
      concepto: { x: ML + 18,   w: 82   },
      unidad:   { x: ML + 100,  w: 14   },
      cantidad: { x: ML + 114,  w: 20   },
      pu:       { x: ML + 134,  w: 25   },
      importe:  { x: ML + 159,  w: CW - 159 }, // 28.9 mm
    }

    // ── Footer helper (called after table + at end) ───────────────────────────
    const drawFooter = (pageNum: number, totalPages: number) => {
      const fy = H - 10
      doc.setFillColor(...NAVY_DARK)
      doc.rect(ML, fy, CW, 6, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.setTextColor(...WHITE)
      doc.text(COMPANY.name, ML + 2.5, fy + 3.8)
      doc.text(`Pag ${pageNum} de ${totalPages}`, W - MR - 2.5, fy + 3.8, { align: 'right' })
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 1. HEADER
    // ═══════════════════════════════════════════════════════════════════════
    // Left: company info
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(...BLACK)
    doc.text(COMPANY.shortName, ML, y + 4.5)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...BLUE_LINK)
    doc.text(COMPANY.website, ML, y + 10)

    doc.setTextColor(...BLACK)
    const contactName = quote.user ? `${quote.user.firstName} ${quote.user.lastName}` : ''
    if (contactName) {
      doc.text(`Contacto:    ${contactName}     ${COMPANY.phone}`, ML, y + 15.5)
      doc.text(`Email: ${COMPANY.email}`, ML, y + 20.5)
      doc.text(COMPANY.city, ML, y + 25.5)
    } else {
      doc.text(`Teléfono:  ${COMPANY.phone}`, ML, y + 15.5)
      doc.text(`Email: ${COMPANY.email}`, ML, y + 20.5)
      doc.text(COMPANY.city, ML, y + 25.5)
    }

    // Right: CALUTEC logo image
    const logoW  = 68
    const logoH  = 22
    const logoX  = W - MR - logoW
    const logoY  = y
    doc.addImage(logoImg, 'PNG', logoX, logoY, logoW, logoH)

    y += 31

    // Separator
    doc.setDrawColor(...NAVY)
    doc.setLineWidth(0.5)
    doc.line(ML, y, W - MR, y)
    y += 5.5

    // ═══════════════════════════════════════════════════════════════════════
    // 2. QUOTE METADATA
    // ═══════════════════════════════════════════════════════════════════════
    const labelW = 28
    const valX   = ML + labelW

    const metaStartY = y
    const leftMeta: Array<[string, string]> = [
      ['COTIZACIÓN :', quote.folio || '—'],
      ['CLIENTE :', quote.customer?.name || '—'],
      ['DIRECCIÓN :', [quote.customer?.address, quote.customer?.city].filter(Boolean).join(', ') || '—'],
    ]

    doc.setFontSize(8.5)
    leftMeta.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...BLACK)
      doc.text(label, ML, y)
      doc.setFont('helvetica', 'normal')
      const maxValW = logoX - valX - 4
      const truncated = doc.splitTextToSize(value, maxValW)[0]
      doc.text(truncated, valX, y)
      y += 5.5
    })

    // Date — right side, aligned with first meta line
    const dateX = W - MR - 80
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(...BLACK)
    doc.text('FECHA', dateX, metaStartY)
    doc.setFont('helvetica', 'normal')
    doc.text(fmtDate(quote.createdAt), dateX, metaStartY + 5.5)

    if (quote.validUntil) {
      doc.setFont('helvetica', 'bold')
      doc.text('VIGENCIA', dateX, metaStartY + 12)
      doc.setFont('helvetica', 'normal')
      doc.text(fmtDate(quote.validUntil), dateX, metaStartY + 17.5)
    }

    y += 5

    // ═══════════════════════════════════════════════════════════════════════
    // 3. TABLE — manual nested header + autoTable body
    // ═══════════════════════════════════════════════════════════════════════

    // ── 3a. Title row (dark navy) ─────────────────────────────────────────
    const titleH = 8
    doc.setFillColor(...NAVY)
    doc.rect(ML, y, CW, titleH, 'F')
    tc(doc, COMPANY.tableTitle, ML + CW / 2, y + titleH / 2, 8.5, true, WHITE)
    y += titleH

    // ── 3b. Nested column headers ─────────────────────────────────────────
    //  ┌──────────┬──────────────────────────────┬────────┬──────────────────────────────┐
    //  │  CLAVE   │          CONCEPTO            │ UNIDAD │       PRESUPUESTO            │
    //  │          │                              │        ├──────────┬──────────┬────────┤
    //  │          │                              │        │ CANTIDAD │   P.U.   │IMPORTE │
    //  └──────────┴──────────────────────────────┴────────┴──────────┴──────────┴────────┘
    const rowH2a = 5.5  // PRESUPUESTO label row height
    const rowH2b = 5.5  // CANTIDAD/P.U./IMPORTE row height
    const rowH2  = rowH2a + rowH2b

    // CLAVE (full rowH2 height, vertically centered)
    cell(doc, COL.clave.x,    y, COL.clave.w,    rowH2, LGRAY)
    tc(doc, 'CLAVE',    COL.clave.x    + COL.clave.w    / 2, y + rowH2 / 2, 7, true, BLACK)

    // CONCEPTO
    cell(doc, COL.concepto.x, y, COL.concepto.w, rowH2, LGRAY)
    tc(doc, 'CONCEPTO', COL.concepto.x + COL.concepto.w / 2, y + rowH2 / 2, 7, true, BLACK)

    // UNIDAD
    cell(doc, COL.unidad.x,   y, COL.unidad.w,   rowH2, LGRAY)
    tc(doc, 'UNIDAD',   COL.unidad.x   + COL.unidad.w   / 2, y + rowH2 / 2, 7, true, BLACK)

    // PRESUPUESTO spanning header (top row)
    const rightColsW = COL.cantidad.w + COL.pu.w + COL.importe.w
    cell(doc, COL.cantidad.x, y, rightColsW, rowH2a, MGRAY)
    tc(doc, 'PRESUPUESTO', COL.cantidad.x + rightColsW / 2, y + rowH2a / 2, 7, true, BLACK)

    // CANTIDAD | P.U. | IMPORTE (bottom row under PRESUPUESTO)
    const y2b = y + rowH2a
    cell(doc, COL.cantidad.x, y2b, COL.cantidad.w, rowH2b, LGRAY)
    tc(doc, 'CANTIDAD', COL.cantidad.x + COL.cantidad.w / 2, y2b + rowH2b / 2, 6.5, true, BLACK)

    cell(doc, COL.pu.x, y2b, COL.pu.w, rowH2b, LGRAY)
    tc(doc, 'P.U.',     COL.pu.x       + COL.pu.w       / 2, y2b + rowH2b / 2, 6.5, true, BLACK)

    cell(doc, COL.importe.x, y2b, COL.importe.w, rowH2b, LGRAY)
    tc(doc, 'IMPORTE',  COL.importe.x  + COL.importe.w  / 2, y2b + rowH2b / 2, 6.5, true, BLACK)

    y += rowH2

    // ── 3c. Body rows via autoTable ───────────────────────────────────────
    const items = (quote.items || []).map((item: any, idx: number) => [
      item.product?.code || '',
      item.product?.name || '',
      'PZA',
      {
        content: Number(item.quantity).toLocaleString('es-MX', { minimumFractionDigits: 2 }),
        styles: { halign: 'right' },
      },
      { content: fmt(item.unitPrice), styles: { halign: 'right' } },
      { content: fmt(item.subtotal),  styles: { halign: 'right' } },
    ])

    let finalY = y

    autoTable(doc, {
      startY: y,
      showHead: 'never',
      margin: { left: ML, right: MR },
      body: items.length > 0 ? items : [
        [{ content: '— Sin partidas —', colSpan: 6, styles: { halign: 'center', textColor: [150, 150, 150] as any } }],
      ],
      columnStyles: {
        0: { cellWidth: COL.clave.w,    halign: 'center' },
        1: { cellWidth: COL.concepto.w, halign: 'left'   },
        2: { cellWidth: COL.unidad.w,   halign: 'center' },
        3: { cellWidth: COL.cantidad.w, halign: 'right'  },
        4: { cellWidth: COL.pu.w,       halign: 'right'  },
        5: { cellWidth: COL.importe.w,  halign: 'right'  },
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: BLACK as any,
        lineColor: BORDER_C as any,
        lineWidth: 0.2,
        cellPadding: { top: 2.5, bottom: 2.5, left: 2, right: 2 },
      },
      alternateRowStyles: { fillColor: [248, 250, 255] as any },
      didDrawPage: (data) => {
        // Redraw title + header on new pages
        if (data.pageNumber > 1) {
          const py = data.settings.margin.top as number
          doc.setFillColor(...NAVY)
          doc.rect(ML, py - titleH - rowH2, CW, titleH, 'F')
          tc(doc, COMPANY.tableTitle + ' (cont.)', ML + CW / 2, py - titleH - rowH2 + titleH / 2, 8.5, true, WHITE)
        }
        drawFooter(data.pageNumber, (doc as any).internal.getNumberOfPages())
      },
    })

    finalY = (doc as any).lastAutoTable.finalY
    y = finalY + 8

    // ═══════════════════════════════════════════════════════════════════════
    // 4. TOTALS BOX (right-aligned)
    // ═══════════════════════════════════════════════════════════════════════
    const totW = 70
    const totX = W - MR - totW
    const rH   = 7.5

    // SUB TOTAL
    doc.setFillColor(...LGRAY)
    doc.setDrawColor(...BORDER_C)
    doc.setLineWidth(0.25)
    doc.rect(totX, y, totW, rH, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...BLACK)
    doc.text('SUB TOTAL', totX + 3, y + 4.9)
    doc.setFont('helvetica', 'normal')
    doc.text(fmt(quote.subtotal), totX + totW - 3, y + 4.9, { align: 'right' })
    y += rH

    // IVA
    doc.setFillColor(...MGRAY)
    doc.rect(totX, y, totW, rH, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...BLACK)
    doc.text('IVA  16%', totX + 3, y + 4.9)
    doc.setFont('helvetica', 'normal')
    doc.text(fmt(quote.tax), totX + totW - 3, y + 4.9, { align: 'right' })
    y += rH

    // TOTAL
    doc.setFillColor(...NAVY)
    doc.rect(totX, y, totW, rH + 1, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(...WHITE)
    doc.text('TOTAL', totX + 3, y + 5.3)
    doc.text(fmt(quote.total), totX + totW - 3, y + 5.3, { align: 'right' })
    y += rH + 1 + 8

    // ═══════════════════════════════════════════════════════════════════════
    // 5. TOTAL EN LETRA
    // ═══════════════════════════════════════════════════════════════════════
    const totalNum = Number(quote.total) || 0
    const intPart  = Math.floor(totalNum)
    const centPart = Math.round((totalNum - intPart) * 100)
    const letraText = `TOTAL EN LETRA (${numToWords(intPart)} ${String(centPart).padStart(2, '0')}/100 M.N.)`

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...BLACK)
    const letraLines = doc.splitTextToSize(letraText, CW - 5)
    doc.text(letraLines, ML, y)
    y += letraLines.length * 4.2 + 5

    // ═══════════════════════════════════════════════════════════════════════
    // 6. ANTICIPO + VIGENCIA note
    // ═══════════════════════════════════════════════════════════════════════
    const anticipoAmt = totalNum * COMPANY.anticipo / 100

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...BLACK)
    doc.text(`NOTA: SE REQUIERE EL ${COMPANY.anticipo}% DE ANTICIPO PARA COMENZAR LA OBRA`, ML, y)
    doc.setFont('helvetica', 'normal')
    doc.text(`ANTICIPO ${COMPANY.anticipo}%`, totX, y)
    doc.text(fmt(anticipoAmt), W - MR, y, { align: 'right' })
    y += 5.5

    doc.setFont('helvetica', 'bold')
    doc.text(`VIGENCIA DE COTIZACIÓN ${COMPANY.vigencia}`, ML, y)
    y += 10

    // ═══════════════════════════════════════════════════════════════════════
    // 7. BANK DATA BOX
    // ═══════════════════════════════════════════════════════════════════════
    const boxW = 90
    const boxH = 26
    doc.setFillColor(244, 247, 253)
    doc.setDrawColor(...NAVY)
    doc.setLineWidth(0.45)
    doc.roundedRect(ML, y, boxW, boxH, 1.5, 1.5, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...NAVY)
    doc.text(`DATOS DE TRANSFERENCIA : ${COMPANY.bankName}`, ML + 3.5, y + 6)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...BLACK)
    doc.text(`NOMBRE:               ${COMPANY.bankHolder}`,         ML + 3.5, y + 11.5)
    doc.text(`CLABE INTERBANCARIA: ${COMPANY.bankClabe}`, ML + 3.5, y + 17)
    doc.text(`NO. DE CUENTA:        ${COMPANY.bankAccount}`,        ML + 3.5, y + 22.5)
    y += boxH + 8

    // ═══════════════════════════════════════════════════════════════════════
    // 8. CONDITIONS
    // ═══════════════════════════════════════════════════════════════════════
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...BLACK)
    doc.text('Condiciones generales:', ML, y)
    y += 3.5

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    const condLines = doc.splitTextToSize(COMPANY.conditions, CW)
    doc.text(condLines, ML, y)

    // ═══════════════════════════════════════════════════════════════════════
    // 9. FOOTER (last page — already drawn per-page via didDrawPage)
    // ═══════════════════════════════════════════════════════════════════════
    const totalPages = (doc as any).internal.getNumberOfPages()
    // Update page numbers on all pages
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p)
      drawFooter(p, totalPages)
    }

    doc.save(`${quote.folio || 'cotizacion'}.pdf`)
  }

  return { generate }
}
