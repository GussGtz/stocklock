import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { SaleStatus, MovementType } from '@prisma/client';

export interface FindAllSalesQuery {
  page?: number;
  limit?: number;
  status?: SaleStatus;
  customerId?: string;
  from?: string;
  to?: string;
}

@Injectable()
export class SalesService {
  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService,
    private eventEmitter: EventEmitter2,
  ) {}

  private async generateFolio(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.saleOrder.count({
      where: {
        saleDate: {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31`),
        },
      },
    });
    return `SL-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  async findAll(query: FindAllSalesQuery) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status) where.status = query.status;
    if (query.customerId) where.customerId = query.customerId;

    if (query.from || query.to) {
      where.saleDate = {};
      if (query.from) where.saleDate.gte = new Date(query.from);
      if (query.to) where.saleDate.lte = new Date(query.to);
    }

    const [total, orders] = await Promise.all([
      this.prisma.saleOrder.count({ where }),
      this.prisma.saleOrder.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: { select: { id: true, name: true, code: true } },
          user: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const order = await this.prisma.saleOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        user: { select: { id: true, firstName: true, lastName: true } },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                code: true,
                unit: true,
                currentStock: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Sale order ${id} not found`);
    }

    return order;
  }

  async create(dto: CreateSaleDto, userId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });
    if (!customer) {
      throw new NotFoundException(`Customer ${dto.customerId} not found`);
    }

    let subtotal = 0;
    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });
      if (!product) {
        throw new NotFoundException(`Product ${item.productId} not found`);
      }
      const lineTotal =
        item.quantity * item.unitPrice * (1 - (item.discount ?? 0) / 100);
      subtotal += lineTotal;
    }

    const discount = 0;
    const taxRate = 0.16;
    const tax = subtotal * taxRate;
    const total = subtotal + tax - discount;
    const folio = await this.generateFolio();

    const order = await this.prisma.saleOrder.create({
      data: {
        folio,
        customerId: dto.customerId,
        userId,
        deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate + 'T00:00:00.000Z') : null,
        notes: dto.notes,
        currency: dto.currency ?? 'MXN',
        exchangeRate: dto.exchangeRate ?? 1,
        subtotal,
        discount,
        tax,
        total,
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount ?? 0,
            subtotal:
              item.quantity *
              item.unitPrice *
              (1 - (item.discount ?? 0) / 100),
            cuts: item.cuts,
            notes: item.notes,
          })),
        },
      },
      include: {
        customer: true,
        items: {
          include: {
            product: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    return order;
  }

  async update(id: string, dto: UpdateSaleDto) {
    const order = await this.findOne(id);

    if (
      order.status === SaleStatus.CANCELLED ||
      order.status === SaleStatus.DELIVERED
    ) {
      throw new BadRequestException(
        `Cannot update a ${order.status.toLowerCase()} sale order`,
      );
    }

    return this.prisma.saleOrder.update({
      where: { id },
      data: {
        ...dto,
        deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate + 'T00:00:00.000Z') : undefined,
      },
    });
  }

  async confirm(id: string, userId: string) {
    const order = await this.findOne(id);

    if (order.status !== SaleStatus.DRAFT) {
      throw new BadRequestException(
        `Only DRAFT orders can be confirmed. Current status: ${order.status}`,
      );
    }

    // Get default warehouse for stock exit
    const defaultWarehouse = await this.prisma.warehouse.findFirst({
      where: { isDefault: true, isActive: true },
    });

    if (!defaultWarehouse) {
      throw new BadRequestException('No default warehouse configured');
    }

    // Create EXIT movements for each item
    for (const item of order.items) {
      await this.inventoryService.createMovement(
        {
          type: MovementType.EXIT,
          productId: item.productId,
          warehouseId: defaultWarehouse.id,
          quantity: Number(item.quantity),
          unitCost: Number(item.unitPrice),
          referenceType: 'SALE',
          referenceId: id,
          notes: `Sale order ${order.folio}`,
        },
        userId,
      );
    }

    const updatedOrder = await this.prisma.saleOrder.update({
      where: { id },
      data: { status: SaleStatus.CONFIRMED },
    });

    this.eventEmitter.emit('sale.confirmed', {
      orderId: id,
      folio: order.folio,
      customerId: order.customerId,
      total: order.total,
    });

    return updatedOrder;
  }

  async deliver(id: string, userId: string) {
    const order = await this.findOne(id);

    if (
      order.status !== SaleStatus.CONFIRMED &&
      order.status !== SaleStatus.PARTIAL
    ) {
      throw new BadRequestException(
        `Order must be CONFIRMED or PARTIAL to mark as delivered`,
      );
    }

    return this.prisma.saleOrder.update({
      where: { id },
      data: {
        status: SaleStatus.DELIVERED,
        items: {
          updateMany: {
            where: { saleOrderId: id },
            data: {},
          },
        },
      },
    });
  }

  async cancel(id: string, userId: string) {
    const order = await this.findOne(id);

    if (
      order.status === SaleStatus.CANCELLED ||
      order.status === SaleStatus.DELIVERED
    ) {
      throw new BadRequestException(
        `Cannot cancel a ${order.status.toLowerCase()} sale order`,
      );
    }

    // If confirmed, return stock
    if (order.status === SaleStatus.CONFIRMED) {
      const defaultWarehouse = await this.prisma.warehouse.findFirst({
        where: { isDefault: true, isActive: true },
      });

      if (defaultWarehouse) {
        for (const item of order.items) {
          await this.inventoryService.createMovement(
            {
              type: MovementType.RETURN,
              productId: item.productId,
              warehouseId: defaultWarehouse.id,
              quantity: Number(item.quantity),
              referenceType: 'SALE_CANCEL',
              referenceId: id,
              notes: `Cancellation of sale order ${order.folio}`,
            },
            userId,
          );
        }
      }
    }

    return this.prisma.saleOrder.update({
      where: { id },
      data: { status: SaleStatus.CANCELLED },
    });
  }
}
