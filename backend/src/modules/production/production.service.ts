import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { CreateProductionDto } from './dto/create-production.dto';
import { CompleteProductionDto } from './dto/complete-production.dto';
import { ProductionStatus, MovementType } from '@prisma/client';

export interface FindAllProductionQuery {
  page?: number;
  limit?: number;
  status?: ProductionStatus;
  from?: string;
  to?: string;
}

@Injectable()
export class ProductionService {
  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService,
  ) {}

  private async generateFolio(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.productionOrder.count({
      where: {
        createdAt: {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31`),
        },
      },
    });
    return `PROD-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  async findAll(query: FindAllProductionQuery) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status) where.status = query.status;

    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }

    const [total, orders] = await Promise.all([
      this.prisma.productionOrder.count({ where }),
      this.prisma.productionOrder.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { inputs: true, outputs: true } },
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
    const order = await this.prisma.productionOrder.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        inputs: {
          include: {
            product: { select: { id: true, name: true, code: true, unit: true } },
          },
        },
        outputs: {
          include: {
            product: { select: { id: true, name: true, code: true, unit: true } },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Production order ${id} not found`);
    }

    return order;
  }

  async create(dto: CreateProductionDto, userId: string) {
    // Validate all products
    for (const input of dto.inputs) {
      const product = await this.prisma.product.findUnique({
        where: { id: input.productId },
      });
      if (!product) {
        throw new NotFoundException(`Input product ${input.productId} not found`);
      }
    }

    for (const output of dto.outputs) {
      const product = await this.prisma.product.findUnique({
        where: { id: output.productId },
      });
      if (!product) {
        throw new NotFoundException(
          `Output product ${output.productId} not found`,
        );
      }
    }

    const folio = await this.generateFolio();

    return this.prisma.productionOrder.create({
      data: {
        folio,
        userId,
        description: dto.description,
        startDate: dto.startDate,
        inputs: {
          create: dto.inputs.map((i) => ({
            productId: i.productId,
            plannedQty: i.plannedQty,
            unitCost: i.unitCost,
          })),
        },
        outputs: {
          create: dto.outputs.map((o) => ({
            productId: o.productId,
            plannedQty: o.plannedQty,
          })),
        },
      },
      include: {
        inputs: { include: { product: true } },
        outputs: { include: { product: true } },
      },
    });
  }

  async start(id: string, userId: string) {
    const order = await this.findOne(id);

    if (order.status !== ProductionStatus.PLANNED) {
      throw new BadRequestException(
        `Only PLANNED orders can be started. Current: ${order.status}`,
      );
    }

    // Get default warehouse for consuming inputs
    const defaultWarehouse = await this.prisma.warehouse.findFirst({
      where: { isDefault: true, isActive: true },
    });

    if (!defaultWarehouse) {
      throw new BadRequestException('No default warehouse configured');
    }

    // Consume input inventory
    for (const input of order.inputs) {
      await this.inventoryService.createMovement(
        {
          type: MovementType.PRODUCTION_OUT,
          productId: input.productId,
          warehouseId: defaultWarehouse.id,
          quantity: Number(input.plannedQty),
          unitCost: Number(input.unitCost),
          referenceType: 'PRODUCTION',
          referenceId: id,
          notes: `Production order ${order.folio} - Input consumption`,
        },
        userId,
      );

      await this.prisma.productionInput.update({
        where: { id: input.id },
        data: { consumedQty: input.plannedQty },
      });
    }

    return this.prisma.productionOrder.update({
      where: { id },
      data: {
        status: ProductionStatus.IN_PROGRESS,
        startDate: new Date(),
      },
    });
  }

  async complete(id: string, userId: string, dto: CompleteProductionDto) {
    const order = await this.findOne(id);

    if (order.status !== ProductionStatus.IN_PROGRESS) {
      throw new BadRequestException(
        `Only IN_PROGRESS orders can be completed. Current: ${order.status}`,
      );
    }

    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: dto.warehouseId },
    });
    if (!warehouse) {
      throw new NotFoundException(`Warehouse ${dto.warehouseId} not found`);
    }

    let totalScrap = 0;

    for (const outputData of dto.outputs) {
      const output = order.outputs.find((o) => o.id === outputData.outputId);
      if (!output) {
        throw new NotFoundException(
          `Output ${outputData.outputId} not found in production order`,
        );
      }

      // Create inventory entry for produced items
      await this.inventoryService.createMovement(
        {
          type: MovementType.PRODUCTION_IN,
          productId: output.productId,
          warehouseId: dto.warehouseId,
          quantity: outputData.producedQty,
          referenceType: 'PRODUCTION',
          referenceId: id,
          notes: `Production order ${order.folio} - Output`,
        },
        userId,
      );

      await this.prisma.productionOutput.update({
        where: { id: outputData.outputId },
        data: {
          producedQty: outputData.producedQty,
          scrapQty: outputData.scrapQty ?? 0,
        },
      });

      totalScrap += outputData.scrapQty ?? 0;
    }

    return this.prisma.productionOrder.update({
      where: { id },
      data: {
        status: ProductionStatus.COMPLETED,
        endDate: new Date(),
        totalScrap,
        notes: dto.notes,
      },
      include: {
        inputs: { include: { product: true } },
        outputs: { include: { product: true } },
      },
    });
  }

  async cancel(id: string, userId: string) {
    const order = await this.findOne(id);

    if (
      order.status === ProductionStatus.COMPLETED ||
      order.status === ProductionStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Cannot cancel a ${order.status.toLowerCase()} production order`,
      );
    }

    return this.prisma.productionOrder.update({
      where: { id },
      data: { status: ProductionStatus.CANCELLED },
    });
  }
}
