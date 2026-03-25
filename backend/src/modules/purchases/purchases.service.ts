import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { ReceivePurchaseDto, ReceiveItemDto } from './dto/receive-purchase.dto';
import { PurchaseStatus, MovementType } from '@prisma/client';

export interface FindAllPurchasesQuery {
  page?: number;
  limit?: number;
  status?: PurchaseStatus;
  supplierId?: string;
  from?: string;
  to?: string;
}

@Injectable()
export class PurchasesService {
  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService,
    private eventEmitter: EventEmitter2,
  ) {}

  private async generateFolio(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.purchaseOrder.count({
      where: {
        orderDate: {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31`),
        },
      },
    });
    return `PO-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  async findAll(query: FindAllPurchasesQuery) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status) where.status = query.status;
    if (query.supplierId) where.supplierId = query.supplierId;

    if (query.from || query.to) {
      where.orderDate = {};
      if (query.from) where.orderDate.gte = new Date(query.from);
      if (query.to) where.orderDate.lte = new Date(query.to);
    }

    const [total, orders] = await Promise.all([
      this.prisma.purchaseOrder.count({ where }),
      this.prisma.purchaseOrder.findMany({
        where,
        skip,
        take: limit,
        include: {
          supplier: { select: { id: true, name: true, code: true } },
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
    const order = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        user: { select: { id: true, firstName: true, lastName: true } },
        items: {
          include: {
            product: {
              select: { id: true, name: true, code: true, unit: true },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Purchase order ${id} not found`);
    }

    return order;
  }

  async create(dto: CreatePurchaseDto, userId: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: dto.supplierId },
    });
    if (!supplier) {
      throw new NotFoundException(`Supplier ${dto.supplierId} not found`);
    }

    // Validate products and calculate totals
    let subtotal = 0;
    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });
      if (!product) {
        throw new NotFoundException(`Product ${item.productId} not found`);
      }
      subtotal += item.orderedQty * item.unitCost;
    }

    const taxRate = 0.16;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;
    const folio = await this.generateFolio();

    const order = await this.prisma.purchaseOrder.create({
      data: {
        folio,
        supplierId: dto.supplierId,
        userId,
        expectedDate: dto.expectedDate,
        notes: dto.notes,
        currency: dto.currency ?? 'MXN',
        exchangeRate: dto.exchangeRate ?? 1,
        subtotal,
        tax,
        total,
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,
            orderedQty: item.orderedQty,
            unitCost: item.unitCost,
            subtotal: item.orderedQty * item.unitCost,
            notes: item.notes,
          })),
        },
      },
      include: {
        supplier: true,
        items: {
          include: {
            product: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    return order;
  }

  async update(id: string, dto: UpdatePurchaseDto) {
    const order = await this.findOne(id);

    if (
      order.status === PurchaseStatus.RECEIVED ||
      order.status === PurchaseStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Cannot update a ${order.status.toLowerCase()} purchase order`,
      );
    }

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: dto,
      include: {
        supplier: { select: { id: true, name: true } },
      },
    });
  }

  async receive(id: string, dto: ReceivePurchaseDto, userId: string) {
    const order = await this.findOne(id);

    if (
      order.status === PurchaseStatus.RECEIVED ||
      order.status === PurchaseStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Cannot receive a ${order.status.toLowerCase()} purchase order`,
      );
    }

    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: dto.warehouseId },
    });
    if (!warehouse) {
      throw new NotFoundException(`Warehouse ${dto.warehouseId} not found`);
    }

    for (const receiveItem of dto.items) {
      const orderItem = order.items.find((i) => i.id === receiveItem.itemId);
      if (!orderItem) {
        throw new NotFoundException(
          `Item ${receiveItem.itemId} not found in this order`,
        );
      }

      if (receiveItem.receivedQty <= 0) {
        throw new BadRequestException('Received quantity must be positive');
      }

      const totalReceived =
        Number(orderItem.receivedQty) + receiveItem.receivedQty;
      if (totalReceived > Number(orderItem.orderedQty)) {
        throw new BadRequestException(
          `Received quantity exceeds ordered quantity for product ${orderItem.productId}`,
        );
      }

      // Create inventory movement
      await this.inventoryService.createMovement(
        {
          type: MovementType.ENTRY,
          productId: orderItem.productId,
          warehouseId: dto.warehouseId,
          quantity: receiveItem.receivedQty,
          unitCost: Number(orderItem.unitCost),
          lotNumber: receiveItem.lotNumber,
          referenceType: 'PURCHASE',
          referenceId: id,
          notes: dto.notes ?? `Reception from PO ${order.folio}`,
        },
        userId,
      );

      // Update item received qty
      await this.prisma.purchaseOrderItem.update({
        where: { id: receiveItem.itemId },
        data: {
          receivedQty: { increment: receiveItem.receivedQty },
          lotNumber: receiveItem.lotNumber,
        },
      });
    }

    // Determine new status
    const updatedItems = await this.prisma.purchaseOrderItem.findMany({
      where: { purchaseOrderId: id },
    });

    const allReceived = updatedItems.every(
      (item) => Number(item.receivedQty) >= Number(item.orderedQty),
    );
    const anyReceived = updatedItems.some(
      (item) => Number(item.receivedQty) > 0,
    );

    const newStatus = allReceived
      ? PurchaseStatus.RECEIVED
      : anyReceived
        ? PurchaseStatus.PARTIAL
        : order.status;

    const updatedOrder = await this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: newStatus,
        receivedDate: allReceived ? new Date() : undefined,
      },
      include: {
        supplier: true,
        items: { include: { product: true } },
      },
    });

    return updatedOrder;
  }

  async cancel(id: string, userId: string) {
    const order = await this.findOne(id);

    if (
      order.status === PurchaseStatus.RECEIVED ||
      order.status === PurchaseStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Cannot cancel a ${order.status.toLowerCase()} purchase order`,
      );
    }

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: PurchaseStatus.CANCELLED },
    });
  }
}
