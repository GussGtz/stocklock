import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { SendQuoteEmailDto } from './dto/send-email-quote.dto';
import { QuoteStatus, SaleStatus } from '@prisma/client';

export interface FindAllQuotesQuery {
  page?: number;
  limit?: number;
  status?: QuoteStatus;
  customerId?: string;
  from?: string;
  to?: string;
}

const QUOTE_INCLUDE = {
  customer: { select: { id: true, name: true, code: true, email: true, phone: true } },
  user: { select: { id: true, firstName: true, lastName: true, email: true } },
  items: {
    include: {
      product: { select: { id: true, name: true, code: true, unit: true, salePrice: true } },
    },
  },
};

@Injectable()
export class QuotesService {
  private readonly logger = new Logger(QuotesService.name);

  constructor(private prisma: PrismaService) {}

  // ── Email transport (lazy-initialized) ─────────────────────────────────────
  private getTransport() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!host || !user || !pass) {
      throw new InternalServerErrorException(
        'Email not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASS env vars.',
      );
    }
    return nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user, pass },
    });
  }

  private buildEmailHtml(quote: any, message: string): string {
    const fmt = (v: any) =>
      new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(v) || 0);
    const fmtDate = (d: any) =>
      d ? new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

    const rows = (quote.items ?? [])
      .map(
        (i: any, idx: number) => `
        <tr style="background:${idx % 2 === 0 ? '#F8FAFC' : '#FFFFFF'}">
          <td style="padding:8px 12px;font-family:monospace;font-size:12px;color:#64748b">${i.product?.code ?? ''}</td>
          <td style="padding:8px 12px;font-size:13px">${i.product?.name ?? ''}</td>
          <td style="padding:8px 12px;text-align:center;font-size:13px">${Number(i.quantity)}</td>
          <td style="padding:8px 12px;text-align:right;font-size:13px">${fmt(i.unitPrice)}</td>
          <td style="padding:8px 12px;text-align:right;font-size:13px;font-weight:600">${fmt(i.subtotal)}</td>
        </tr>`,
      )
      .join('');

    return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:32px 0">
<tr><td align="center">
<table width="620" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">

  <!-- Header -->
  <tr>
    <td style="background:#1C3E69;padding:28px 32px">
      <table width="100%"><tr>
        <td>
          <div style="color:#FFFFFF;font-size:26px;font-weight:900;letter-spacing:1px">CALUTEC</div>
          <div style="color:#93C5FD;font-size:11px;letter-spacing:2px;margin-top:2px">QUALITY TECHNICAL ALUMINUM</div>
        </td>
        <td align="right">
          <div style="color:#93C5FD;font-size:11px">www.calutec.com</div>
          <div style="color:#93C5FD;font-size:11px;margin-top:2px">contacto@calutec.com</div>
        </td>
      </tr></table>
    </td>
  </tr>

  <!-- Quote badge -->
  <tr>
    <td style="background:#EFF6FF;padding:16px 32px;border-bottom:1px solid #DBEAFE">
      <table width="100%"><tr>
        <td>
          <div style="font-size:18px;font-weight:700;color:#1E3A5F">Cotización ${quote.folio}</div>
          <div style="font-size:13px;color:#64748b;margin-top:2px">Para: <strong>${quote.customer?.name ?? ''}</strong></div>
        </td>
        <td align="right">
          <div style="font-size:12px;color:#64748b">Fecha: <strong>${fmtDate(quote.createdAt)}</strong></div>
          ${quote.validUntil ? `<div style="font-size:12px;color:#dc2626;margin-top:4px">Válida hasta: <strong>${fmtDate(quote.validUntil)}</strong></div>` : ''}
        </td>
      </tr></table>
    </td>
  </tr>

  <!-- Message -->
  <tr>
    <td style="padding:24px 32px 16px">
      <p style="margin:0;font-size:14px;color:#374151;line-height:1.6">${message.replace(/\n/g, '<br>')}</p>
    </td>
  </tr>

  <!-- Items table -->
  <tr>
    <td style="padding:0 32px 24px">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:8px;overflow:hidden;border:1px solid #E2E8F0">
        <tr style="background:#1C3E69">
          <th style="padding:10px 12px;text-align:left;color:#fff;font-size:11px;font-weight:600;letter-spacing:.5px">CLAVE</th>
          <th style="padding:10px 12px;text-align:left;color:#fff;font-size:11px;font-weight:600">CONCEPTO</th>
          <th style="padding:10px 12px;text-align:center;color:#fff;font-size:11px;font-weight:600">CANT.</th>
          <th style="padding:10px 12px;text-align:right;color:#fff;font-size:11px;font-weight:600">P.U.</th>
          <th style="padding:10px 12px;text-align:right;color:#fff;font-size:11px;font-weight:600">IMPORTE</th>
        </tr>
        ${rows}
      </table>
    </td>
  </tr>

  <!-- Totals -->
  <tr>
    <td style="padding:0 32px 32px">
      <table align="right" cellpadding="0" cellspacing="0" style="min-width:220px">
        <tr>
          <td style="padding:6px 16px 6px 24px;font-size:13px;color:#64748b;background:#F8FAFC;border-radius:4px 0 0 0">Subtotal</td>
          <td style="padding:6px 16px;font-size:13px;text-align:right;background:#F8FAFC;border-radius:0 4px 0 0">${fmt(quote.subtotal)}</td>
        </tr>
        <tr>
          <td style="padding:6px 16px 6px 24px;font-size:13px;color:#64748b;background:#EDF2FB">IVA 16%</td>
          <td style="padding:6px 16px;font-size:13px;text-align:right;background:#EDF2FB">${fmt(quote.tax)}</td>
        </tr>
        <tr>
          <td style="padding:10px 16px 10px 24px;font-size:15px;font-weight:700;background:#1C3E69;color:#fff;border-radius:0 0 0 6px">TOTAL</td>
          <td style="padding:10px 16px;font-size:15px;font-weight:700;text-align:right;background:#1C3E69;color:#fff;border-radius:0 0 6px 0">${fmt(quote.total)}</td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Notes -->
  ${quote.notes ? `<tr><td style="padding:0 32px 24px"><div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;padding:12px 16px;font-size:13px;color:#92400E">${quote.notes}</div></td></tr>` : ''}

  <!-- Footer -->
  <tr>
    <td style="background:#1C3E69;padding:16px 32px">
      <p style="margin:0;font-size:11px;color:#93C5FD;text-align:center">
        CALUTEC SA DE CV — Cancún, Quintana Roo — contacto@calutec.com — 998 394 1625
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
  }

  private async generateFolio(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.quote.count({
      where: { createdAt: { gte: new Date(`${year}-01-01`), lte: new Date(`${year}-12-31`) } },
    });
    return `COT-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  async findAll(query: FindAllQuotesQuery) {
    const page  = Number(query.page)  || 1;
    const limit = Number(query.limit) || 20;
    const skip  = (page - 1) * limit;

    const where: any = {};
    if (query.status)     where.status = query.status;
    if (query.customerId) where.customerId = query.customerId;
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to)   where.createdAt.lte = new Date(query.to);
    }

    const [total, quotes] = await Promise.all([
      this.prisma.quote.count({ where }),
      this.prisma.quote.findMany({
        where, skip, take: limit,
        include: {
          customer: { select: { id: true, name: true, code: true } },
          user: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data: quotes,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: QUOTE_INCLUDE,
    });
    if (!quote) throw new NotFoundException(`Quote ${id} not found`);
    return quote;
  }

  async create(dto: CreateQuoteDto, userId: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id: dto.customerId } });
    if (!customer) throw new NotFoundException(`Customer ${dto.customerId} not found`);

    let subtotal = 0;
    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) throw new NotFoundException(`Product ${item.productId} not found`);
      const lineTotal = item.quantity * item.unitPrice * (1 - (item.discount ?? 0) / 100);
      subtotal += lineTotal;
    }

    const tax   = subtotal * 0.16;
    const total = subtotal + tax;
    const folio = await this.generateFolio();

    return this.prisma.quote.create({
      data: {
        folio,
        customerId: dto.customerId,
        userId,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        notes: dto.notes,
        currency: dto.currency ?? 'MXN',
        exchangeRate: dto.exchangeRate ?? 1,
        subtotal,
        tax,
        total,
        items: {
          create: dto.items.map(item => ({
            productId: item.productId,
            quantity:  item.quantity,
            unitPrice: item.unitPrice,
            discount:  item.discount ?? 0,
            subtotal:  item.quantity * item.unitPrice * (1 - (item.discount ?? 0) / 100),
            notes:     item.notes,
          })),
        },
      },
      include: QUOTE_INCLUDE,
    });
  }

  async update(id: string, dto: UpdateQuoteDto) {
    const quote = await this.findOne(id);
    if (quote.status !== QuoteStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT quotes can be updated');
    }
    return this.prisma.quote.update({
      where: { id },
      data: {
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        notes:      dto.notes,
        currency:   dto.currency,
      },
      include: QUOTE_INCLUDE,
    });
  }

  async sendEmail(id: string, dto: SendQuoteEmailDto) {
    const quote = await this.findOne(id);
    if (quote.status !== QuoteStatus.DRAFT) {
      throw new BadRequestException(`Solo cotizaciones en borrador se pueden enviar. Estado actual: ${quote.status}`);
    }

    const transport = this.getTransport();
    const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;
    const subject = dto.subject ?? `Cotización ${quote.folio} — CALUTEC`;
    const message = dto.message?.trim() ||
      `Estimado(a) ${quote.customer?.name ?? 'cliente'},\n\nAdjunto encontrará los detalles de nuestra cotización ${quote.folio}.\n\nQuedamos a sus órdenes para cualquier aclaración.`;

    const attachments = dto.pdfBase64
      ? [{ filename: `${quote.folio}.pdf`, content: Buffer.from(dto.pdfBase64, 'base64'), contentType: 'application/pdf' }]
      : [];

    try {
      await transport.sendMail({
        from,
        to: dto.to,
        cc: dto.cc || undefined,
        subject,
        html: this.buildEmailHtml(quote, message),
        attachments,
      });
      this.logger.log(`Quote email sent: ${quote.folio} → ${dto.to}`);
    } catch (err) {
      this.logger.error(`Failed to send quote email: ${err.message}`);
      throw new InternalServerErrorException(`Error al enviar el correo: ${err.message}`);
    }

    // Mark as SENT after successful email delivery
    return this.prisma.quote.update({
      where: { id },
      data: { status: QuoteStatus.SENT },
      include: QUOTE_INCLUDE,
    });
  }

  async approve(id: string) {
    const quote = await this.findOne(id);
    if (quote.status !== QuoteStatus.SENT) {
      throw new BadRequestException(`Only SENT quotes can be approved. Current: ${quote.status}`);
    }
    return this.prisma.quote.update({
      where: { id },
      data: { status: QuoteStatus.APPROVED },
      include: QUOTE_INCLUDE,
    });
  }

  async reject(id: string, reason?: string) {
    const quote = await this.findOne(id);
    if (!['SENT', 'APPROVED'].includes(quote.status)) {
      throw new BadRequestException(`Cannot reject a ${quote.status} quote`);
    }
    return this.prisma.quote.update({
      where: { id },
      data: {
        status: QuoteStatus.REJECTED,
        notes: reason ? `${quote.notes ?? ''}\n[Rechazado]: ${reason}`.trim() : quote.notes,
      },
      include: QUOTE_INCLUDE,
    });
  }

  async convertToSale(id: string, userId: string) {
    const quote = await this.findOne(id);
    if (quote.status !== QuoteStatus.APPROVED) {
      throw new BadRequestException(`Only APPROVED quotes can be converted to sale. Current: ${quote.status}`);
    }

    // Generate sale folio
    const year  = new Date().getFullYear();
    const count = await this.prisma.saleOrder.count({
      where: { saleDate: { gte: new Date(`${year}-01-01`), lte: new Date(`${year}-12-31`) } },
    });
    const salefolio = `SL-${year}-${String(count + 1).padStart(4, '0')}`;

    // Create sale order from quote
    const saleOrder = await this.prisma.saleOrder.create({
      data: {
        folio:       salefolio,
        customerId:  quote.customerId,
        userId,
        currency:    quote.currency,
        exchangeRate: Number(quote.exchangeRate),
        subtotal:    Number(quote.subtotal),
        discount:    Number(quote.discount),
        tax:         Number(quote.tax),
        total:       Number(quote.total),
        notes:       `Convertida desde cotización ${quote.folio}`,
        status:      SaleStatus.DRAFT,
        items: {
          create: quote.items.map(item => ({
            productId: item.productId,
            quantity:  Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            discount:  Number(item.discount),
            subtotal:  Number(item.subtotal),
            notes:     item.notes,
          })),
        },
      },
    });

    // Mark quote as converted
    await this.prisma.quote.update({
      where: { id },
      data: { status: QuoteStatus.CONVERTED, saleOrderId: saleOrder.id },
    });

    return { quote: { ...quote, status: QuoteStatus.CONVERTED, saleOrderId: saleOrder.id }, saleOrder };
  }

  async expire(id: string) {
    const quote = await this.findOne(id);
    if (!['DRAFT', 'SENT'].includes(quote.status)) {
      throw new BadRequestException(`Cannot expire a ${quote.status} quote`);
    }
    return this.prisma.quote.update({
      where: { id },
      data: { status: QuoteStatus.EXPIRED },
      include: QUOTE_INCLUDE,
    });
  }
}
