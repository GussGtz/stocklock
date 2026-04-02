import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
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
  customer: { select: { id: true, name: true, code: true } },
  user: { select: { id: true, firstName: true, lastName: true } },
  items: {
    include: {
      product: { select: { id: true, name: true, code: true, unit: true, salePrice: true } },
    },
  },
};

@Injectable()
export class QuotesService {
  constructor(private prisma: PrismaService) {}

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

  async send(id: string) {
    const quote = await this.findOne(id);
    if (quote.status !== QuoteStatus.DRAFT) {
      throw new BadRequestException(`Only DRAFT quotes can be sent. Current: ${quote.status}`);
    }
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
