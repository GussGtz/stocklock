import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

export interface FindAllProductsQuery {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  isActive?: boolean | string;
}

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: FindAllProductsQuery) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.isActive !== undefined) {
      where.isActive = query.isActive === 'true' || query.isActive === true;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
        { barcode: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    const [total, products] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: {
            select: { id: true, name: true, color: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        inventoryItems: {
          include: {
            warehouse: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    return product;
  }

  async create(dto: CreateProductDto) {
    const existing = await this.prisma.product.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new BadRequestException(
        `Product with code ${dto.code} already exists`,
      );
    }

    if (dto.barcode) {
      const existingBarcode = await this.prisma.product.findUnique({
        where: { barcode: dto.barcode },
      });
      if (existingBarcode) {
        throw new BadRequestException(
          `Product with barcode ${dto.barcode} already exists`,
        );
      }
    }

    const { initialStock, ...productData } = dto;
    return this.prisma.product.create({
      data: {
        ...productData,
        costPrice: productData.costPrice ?? 0,
        salePrice: productData.salePrice ?? 0,
        minStock: productData.minStock ?? 0,
        maxStock: productData.maxStock ?? 0,
        currentStock: initialStock ?? 0,
      },
      include: {
        category: { select: { id: true, name: true, color: true } },
      },
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);

    if (dto.code) {
      const existing = await this.prisma.product.findFirst({
        where: { code: dto.code, NOT: { id } },
      });
      if (existing) {
        throw new BadRequestException(
          `Product with code ${dto.code} already exists`,
        );
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: dto,
      include: {
        category: { select: { id: true, name: true, color: true } },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Product deactivated successfully' };
  }

  async updateStock(
    id: string,
    quantity: number,
    operation: 'add' | 'subtract',
  ) {
    const product = await this.prisma.product.findUnique({ where: { id } });

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    const currentStock = Number(product.currentStock);
    let newStock: number;

    if (operation === 'add') {
      newStock = currentStock + quantity;
    } else {
      newStock = currentStock - quantity;
      if (newStock < 0) {
        throw new BadRequestException(
          `Insufficient stock. Current: ${currentStock}, Requested: ${quantity}`,
        );
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: { currentStock: newStock },
    });
  }

  async getLowStockProducts() {
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        AND: [
          { minStock: { gt: 0 } },
        ],
      },
      include: {
        category: { select: { id: true, name: true, color: true } },
      },
    });

    // Filter in application since Prisma doesn't support column comparisons directly
    return products.filter(
      (p) => Number(p.currentStock) <= Number(p.minStock),
    );
  }
}
