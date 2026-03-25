import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';

@Injectable()
export class WarehousesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.warehouse.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { inventoryItems: true } },
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id },
      include: {
        _count: { select: { inventoryItems: true } },
      },
    });

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with id ${id} not found`);
    }

    return warehouse;
  }

  async create(dto: CreateWarehouseDto) {
    const existingName = await this.prisma.warehouse.findUnique({
      where: { name: dto.name },
    });
    if (existingName) {
      throw new BadRequestException(
        `Warehouse with name "${dto.name}" already exists`,
      );
    }

    const existingCode = await this.prisma.warehouse.findUnique({
      where: { code: dto.code },
    });
    if (existingCode) {
      throw new BadRequestException(
        `Warehouse with code ${dto.code} already exists`,
      );
    }

    if (dto.isDefault) {
      await this.prisma.warehouse.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.warehouse.create({ data: dto });
  }

  async update(id: string, dto: UpdateWarehouseDto) {
    await this.findOne(id);

    if (dto.name) {
      const existing = await this.prisma.warehouse.findFirst({
        where: { name: dto.name, NOT: { id } },
      });
      if (existing) {
        throw new BadRequestException(
          `Warehouse with name "${dto.name}" already exists`,
        );
      }
    }

    if (dto.code) {
      const existing = await this.prisma.warehouse.findFirst({
        where: { code: dto.code, NOT: { id } },
      });
      if (existing) {
        throw new BadRequestException(
          `Warehouse with code ${dto.code} already exists`,
        );
      }
    }

    if (dto.isDefault) {
      await this.prisma.warehouse.updateMany({
        where: { isDefault: true, NOT: { id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.warehouse.update({ where: { id }, data: dto });
  }

  async setDefault(id: string) {
    await this.findOne(id);

    await this.prisma.warehouse.updateMany({
      data: { isDefault: false },
    });

    return this.prisma.warehouse.update({
      where: { id },
      data: { isDefault: true },
    });
  }

  async remove(id: string) {
    const warehouse = await this.findOne(id);

    if (warehouse.isDefault) {
      throw new BadRequestException('Cannot deactivate the default warehouse');
    }

    await this.prisma.warehouse.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Warehouse deactivated successfully' };
  }

  async getInventory(warehouseId: string) {
    await this.findOne(warehouseId);

    const items = await this.prisma.inventoryItem.findMany({
      where: { warehouseId },
      include: {
        product: {
          include: {
            category: { select: { id: true, name: true, color: true } },
          },
        },
      },
      orderBy: { product: { name: 'asc' } },
    });

    return items;
  }
}
