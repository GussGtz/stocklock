import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSectorDto } from './dto/create-sector.dto';
import { CreateTypeDto } from './dto/create-type.dto';

@Injectable()
export class SectorsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.aluminumSector.findMany({
      include: {
        types: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { products: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(id: string) {
    const sector = await this.prisma.aluminumSector.findUnique({
      where: { id },
      include: {
        types: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { products: true } },
      },
    });
    if (!sector) throw new NotFoundException('Sector no encontrado');
    return sector;
  }

  async create(dto: CreateSectorDto) {
    const exists = await this.prisma.aluminumSector.findUnique({ where: { name: dto.name } });
    if (exists) throw new ConflictException('Ya existe un sector con ese nombre');
    return this.prisma.aluminumSector.create({ data: dto, include: { types: true } });
  }

  async update(id: string, dto: Partial<CreateSectorDto>) {
    await this.findOne(id);
    return this.prisma.aluminumSector.update({
      where: { id },
      data: dto,
      include: { types: { orderBy: { sortOrder: 'asc' } }, _count: { select: { products: true } } },
    });
  }

  async toggle(id: string) {
    const sector = await this.findOne(id);
    return this.prisma.aluminumSector.update({
      where: { id },
      data: { isActive: !sector.isActive },
      include: { types: { orderBy: { sortOrder: 'asc' } }, _count: { select: { products: true } } },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.aluminumSector.delete({ where: { id } });
  }

  // Types
  async findTypes(sectorId: string) {
    await this.findOne(sectorId);
    return this.prisma.aluminumType.findMany({
      where: { sectorId },
      include: { _count: { select: { products: true } } },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createType(sectorId: string, dto: CreateTypeDto) {
    await this.findOne(sectorId);
    const exists = await this.prisma.aluminumType.findFirst({ where: { name: dto.name, sectorId } });
    if (exists) throw new ConflictException('Ya existe un tipo con ese nombre en este sector');
    return this.prisma.aluminumType.create({
      data: { ...dto, sectorId },
      include: { _count: { select: { products: true } } },
    });
  }

  async updateType(sectorId: string, typeId: string, dto: Partial<CreateTypeDto>) {
    const type = await this.prisma.aluminumType.findFirst({ where: { id: typeId, sectorId } });
    if (!type) throw new NotFoundException('Tipo no encontrado');
    return this.prisma.aluminumType.update({
      where: { id: typeId },
      data: dto,
      include: { _count: { select: { products: true } } },
    });
  }

  async toggleType(sectorId: string, typeId: string) {
    const type = await this.prisma.aluminumType.findFirst({ where: { id: typeId, sectorId } });
    if (!type) throw new NotFoundException('Tipo no encontrado');
    return this.prisma.aluminumType.update({
      where: { id: typeId },
      data: { isActive: !type.isActive },
      include: { _count: { select: { products: true } } },
    });
  }

  async removeType(sectorId: string, typeId: string) {
    const type = await this.prisma.aluminumType.findFirst({ where: { id: typeId, sectorId } });
    if (!type) throw new NotFoundException('Tipo no encontrado');
    return this.prisma.aluminumType.delete({ where: { id: typeId } });
  }
}
