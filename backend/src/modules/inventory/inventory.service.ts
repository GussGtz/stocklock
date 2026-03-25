import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateMovementDto } from './dto/create-movement.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { TransferStockDto } from './dto/transfer-stock.dto';
import { MovementType } from '@prisma/client';

export interface GetMovementsQuery {
  page?: number;
  limit?: number;
  type?: MovementType;
  productId?: string;
  warehouseId?: string;
  from?: string;
  to?: string;
}

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async createMovement(dto: CreateMovementDto, userId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });
    if (!product) {
      throw new NotFoundException(`Product ${dto.productId} not found`);
    }

    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: dto.warehouseId },
    });
    if (!warehouse) {
      throw new NotFoundException(`Warehouse ${dto.warehouseId} not found`);
    }

    // Get or create inventory item
    let inventoryItem = await this.prisma.inventoryItem.findUnique({
      where: {
        productId_warehouseId: {
          productId: dto.productId,
          warehouseId: dto.warehouseId,
        },
      },
    });

    const previousStock = inventoryItem ? Number(inventoryItem.quantity) : 0;
    let newStock: number;

    const isExit =
      dto.type === MovementType.EXIT ||
      dto.type === MovementType.PRODUCTION_OUT;

    if (isExit) {
      if (previousStock < dto.quantity) {
        throw new BadRequestException(
          `Insufficient stock. Current: ${previousStock}, Requested: ${dto.quantity}`,
        );
      }
      newStock = previousStock - dto.quantity;
    } else if (dto.type === MovementType.ADJUSTMENT) {
      newStock = dto.quantity;
    } else {
      newStock = previousStock + dto.quantity;
    }

    const totalCost =
      dto.unitCost != null ? dto.unitCost * dto.quantity : undefined;
    const unitCost = dto.unitCost ?? Number(product.costPrice);

    const movement = await this.prisma.$transaction(async (tx) => {
      // Create inventory movement
      const mov = await tx.inventoryMovement.create({
        data: {
          type: dto.type,
          productId: dto.productId,
          warehouseId: dto.warehouseId,
          quantity: dto.quantity,
          unitCost: unitCost,
          totalCost: unitCost * dto.quantity,
          previousStock,
          currentStock: newStock,
          notes: dto.notes,
          lotNumber: dto.lotNumber,
          referenceType: dto.referenceType,
          referenceId: dto.referenceId,
          userId,
        },
        include: {
          product: { select: { id: true, name: true, code: true } },
          warehouse: { select: { id: true, name: true } },
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      // Upsert inventory item
      await tx.inventoryItem.upsert({
        where: {
          productId_warehouseId: {
            productId: dto.productId,
            warehouseId: dto.warehouseId,
          },
        },
        create: {
          productId: dto.productId,
          warehouseId: dto.warehouseId,
          quantity: newStock,
          lotNumber: dto.lotNumber,
        },
        update: {
          quantity: newStock,
          lotNumber: dto.lotNumber ?? undefined,
        },
      });

      // Update product currentStock
      const allItems = await tx.inventoryItem.findMany({
        where: { productId: dto.productId },
      });
      const totalStock = allItems.reduce(
        (sum, item) => sum + Number(item.quantity),
        0,
      );
      await tx.product.update({
        where: { id: dto.productId },
        data: { currentStock: totalStock },
      });

      // Create Kardex entry
      const entryQty = isExit
        ? null
        : dto.type === MovementType.ADJUSTMENT
          ? null
          : dto.quantity;
      const exitQty = isExit ? dto.quantity : null;
      const adjustQty =
        dto.type === MovementType.ADJUSTMENT ? dto.quantity : null;

      await tx.kardex.create({
        data: {
          productId: dto.productId,
          movementId: mov.id,
          date: new Date(),
          entryQty,
          exitQty,
          adjustQty,
          balance: newStock,
          unitCost,
          totalValue: newStock * unitCost,
          description: dto.notes ?? `${dto.type} movement`,
        },
      });

      return mov;
    });

    this.eventEmitter.emit('inventory.movement', {
      movementId: movement.id,
      type: movement.type,
      product: movement.product,
      warehouse: movement.warehouse,
      quantity: movement.quantity,
      currentStock: newStock,
    });

    return movement;
  }

  async getKardex(productId: string, from?: string, to?: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    const where: any = { productId };

    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }

    const entries = await this.prisma.kardex.findMany({
      where,
      include: {
        movement: {
          include: {
            warehouse: { select: { id: true, name: true } },
            user: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    return { product, entries };
  }

  async getMovements(query: GetMovementsQuery) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.type) where.type = query.type;
    if (query.productId) where.productId = query.productId;
    if (query.warehouseId) where.warehouseId = query.warehouseId;

    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }

    const [total, movements] = await Promise.all([
      this.prisma.inventoryMovement.count({ where }),
      this.prisma.inventoryMovement.findMany({
        where,
        skip,
        take: limit,
        include: {
          product: { select: { id: true, name: true, code: true } },
          warehouse: { select: { id: true, name: true } },
          user: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data: movements,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCurrentStock(productId: string, warehouseId?: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    const where: any = { productId };
    if (warehouseId) where.warehouseId = warehouseId;

    const items = await this.prisma.inventoryItem.findMany({
      where,
      include: {
        warehouse: { select: { id: true, name: true, code: true } },
      },
    });

    const totalStock = items.reduce((sum, item) => sum + Number(item.quantity), 0);

    return {
      product: {
        id: product.id,
        name: product.name,
        code: product.code,
        currentStock: totalStock,
      },
      items,
    };
  }

  async adjustStock(
    productId: string,
    warehouseId: string,
    newQuantity: number,
    reason: string,
    userId: string,
  ) {
    return this.createMovement(
      {
        type: MovementType.ADJUSTMENT,
        productId,
        warehouseId,
        quantity: newQuantity,
        notes: reason,
      },
      userId,
    );
  }

  async transferStock(
    fromWarehouseId: string,
    toWarehouseId: string,
    productId: string,
    quantity: number,
    userId: string,
    notes?: string,
  ) {
    if (fromWarehouseId === toWarehouseId) {
      throw new BadRequestException('Source and destination warehouses must be different');
    }

    const fromItem = await this.prisma.inventoryItem.findUnique({
      where: {
        productId_warehouseId: { productId, warehouseId: fromWarehouseId },
      },
    });

    if (!fromItem || Number(fromItem.quantity) < quantity) {
      throw new BadRequestException(
        `Insufficient stock in source warehouse. Available: ${fromItem ? Number(fromItem.quantity) : 0}`,
      );
    }

    // Exit from source
    await this.createMovement(
      {
        type: MovementType.TRANSFER,
        productId,
        warehouseId: fromWarehouseId,
        quantity,
        notes: notes ?? `Transfer to warehouse ${toWarehouseId}`,
        referenceType: 'TRANSFER',
        referenceId: toWarehouseId,
      },
      userId,
    );

    // Entry to destination
    const entry = await this.createMovement(
      {
        type: MovementType.ENTRY,
        productId,
        warehouseId: toWarehouseId,
        quantity,
        notes: notes ?? `Transfer from warehouse ${fromWarehouseId}`,
        referenceType: 'TRANSFER',
        referenceId: fromWarehouseId,
      },
      userId,
    );

    return { message: 'Transfer completed successfully', movement: entry };
  }

  async getSummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalProducts,
      activeProducts,
      movementsToday,
      lowStockProducts,
      inventoryValue,
    ] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.inventoryMovement.count({
        where: { createdAt: { gte: today } },
      }),
      this.prisma.product.findMany({
        where: { isActive: true, minStock: { gt: 0 } },
      }),
      this.prisma.product.aggregate({
        _sum: { currentStock: true },
        where: { isActive: true },
      }),
    ]);

    const lowStockCount = lowStockProducts.filter(
      (p) => Number(p.currentStock) <= Number(p.minStock),
    ).length;

    const totalValue = await this.prisma.product.findMany({
      where: { isActive: true },
      select: { currentStock: true, costPrice: true },
    });

    const estimatedValue = totalValue.reduce(
      (sum, p) => sum + Number(p.currentStock) * Number(p.costPrice),
      0,
    );

    return {
      totalProducts,
      activeProducts,
      movementsToday,
      lowStockCount,
      estimatedInventoryValue: estimatedValue,
      totalStockUnits: Number(inventoryValue._sum.currentStock ?? 0),
    };
  }
}
