import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSeriesDto } from './dto/create-series.dto';

@Injectable()
export class SeriesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.aluminumSeries.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(id: string) {
    const series = await this.prisma.aluminumSeries.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!series) throw new NotFoundException(`Series ${id} not found`);
    return series;
  }

  async create(dto: CreateSeriesDto) {
    const existing = await this.prisma.aluminumSeries.findUnique({ where: { code: dto.code } });
    if (existing) throw new ConflictException(`Series with code ${dto.code} already exists`);
    return this.prisma.aluminumSeries.create({ data: dto });
  }

  async update(id: string, dto: Partial<CreateSeriesDto>) {
    await this.findOne(id);
    return this.prisma.aluminumSeries.update({ where: { id }, data: dto });
  }

  async toggle(id: string) {
    const series = await this.findOne(id);
    return this.prisma.aluminumSeries.update({
      where: { id },
      data: { isActive: !series.isActive },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.aluminumSeries.delete({ where: { id } });
    return { message: 'Series deleted successfully' };
  }
}
