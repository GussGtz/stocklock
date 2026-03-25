import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SaleStatus, PurchaseStatus } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getInventoryReport(warehouseId?: string) {
    const where: any = { isActive: true };
    const itemsWhere: any = {};

    if (warehouseId) {
      itemsWhere.warehouseId = warehouseId;
    }

    const products = await this.prisma.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, color: true } },
        inventoryItems: {
          where: itemsWhere,
          include: {
            warehouse: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const report = products.map((p) => {
      const totalQty = p.inventoryItems.reduce(
        (sum, item) => sum + Number(item.quantity),
        0,
      );
      const totalValue = totalQty * Number(p.costPrice);

      return {
        id: p.id,
        code: p.code,
        name: p.name,
        category: p.category?.name,
        unit: p.unit,
        costPrice: Number(p.costPrice),
        salePrice: Number(p.salePrice),
        currentStock: totalQty,
        minStock: Number(p.minStock),
        maxStock: Number(p.maxStock),
        totalValue,
        isLowStock: totalQty <= Number(p.minStock),
        isOverStock:
          Number(p.maxStock) > 0 && totalQty > Number(p.maxStock),
        warehouses: p.inventoryItems.map((item) => ({
          warehouse: item.warehouse.name,
          quantity: Number(item.quantity),
        })),
      };
    });

    const totalValue = report.reduce((sum, p) => sum + p.totalValue, 0);
    const totalProducts = report.length;
    const lowStockCount = report.filter((p) => p.isLowStock).length;

    return {
      summary: {
        totalProducts,
        totalValue,
        lowStockCount,
        generatedAt: new Date(),
      },
      products: report,
    };
  }

  async getSalesReport(from: string, to: string) {
    const fromDate = from ? new Date(from) : new Date(new Date().setDate(1));
    const toDate = to ? new Date(to) : new Date();

    const orders = await this.prisma.saleOrder.findMany({
      where: {
        saleDate: { gte: fromDate, lte: toDate },
        status: { not: SaleStatus.CANCELLED },
      },
      include: {
        customer: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, code: true } },
          },
        },
      },
      orderBy: { saleDate: 'asc' },
    });

    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
    const totalOrders = orders.length;

    // By product
    const productMap = new Map<
      string,
      { name: string; code: string; quantity: number; revenue: number }
    >();

    for (const order of orders) {
      for (const item of order.items) {
        const key = item.productId;
        const existing = productMap.get(key) ?? {
          name: item.product.name,
          code: item.product.code,
          quantity: 0,
          revenue: 0,
        };
        existing.quantity += Number(item.quantity);
        existing.revenue += Number(item.subtotal);
        productMap.set(key, existing);
      }
    }

    // By customer
    const customerMap = new Map<
      string,
      { name: string; orders: number; revenue: number }
    >();

    for (const order of orders) {
      const key = order.customerId;
      const existing = customerMap.get(key) ?? {
        name: order.customer.name,
        orders: 0,
        revenue: 0,
      };
      existing.orders += 1;
      existing.revenue += Number(order.total);
      customerMap.set(key, existing);
    }

    return {
      summary: {
        from: fromDate,
        to: toDate,
        totalOrders,
        totalRevenue,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      },
      byProduct: Array.from(productMap.entries())
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.revenue - a.revenue),
      byCustomer: Array.from(customerMap.entries())
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.revenue - a.revenue),
      orders,
    };
  }

  async getPurchasesReport(from: string, to: string) {
    const fromDate = from ? new Date(from) : new Date(new Date().setDate(1));
    const toDate = to ? new Date(to) : new Date();

    const orders = await this.prisma.purchaseOrder.findMany({
      where: {
        orderDate: { gte: fromDate, lte: toDate },
        status: { not: PurchaseStatus.CANCELLED },
      },
      include: {
        supplier: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, code: true } },
          },
        },
      },
      orderBy: { orderDate: 'asc' },
    });

    const totalSpend = orders.reduce((sum, o) => sum + Number(o.total), 0);
    const totalOrders = orders.length;

    // By supplier
    const supplierMap = new Map<
      string,
      { name: string; orders: number; spend: number }
    >();

    for (const order of orders) {
      const key = order.supplierId;
      const existing = supplierMap.get(key) ?? {
        name: order.supplier.name,
        orders: 0,
        spend: 0,
      };
      existing.orders += 1;
      existing.spend += Number(order.total);
      supplierMap.set(key, existing);
    }

    return {
      summary: {
        from: fromDate,
        to: toDate,
        totalOrders,
        totalSpend,
        averageOrderValue: totalOrders > 0 ? totalSpend / totalOrders : 0,
      },
      bySupplier: Array.from(supplierMap.entries())
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.spend - a.spend),
      orders,
    };
  }

  async getTopProducts(limit = 10, from?: string, to?: string) {
    const fromDate = from ? new Date(from) : new Date(new Date().setDate(1));
    const toDate = to ? new Date(to) : new Date();

    const items = await this.prisma.saleOrderItem.findMany({
      where: {
        saleOrder: {
          saleDate: { gte: fromDate, lte: toDate },
          status: { not: SaleStatus.CANCELLED },
        },
      },
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
    });

    const productMap = new Map<
      string,
      {
        product: any;
        totalQuantity: number;
        totalRevenue: number;
        orderCount: number;
      }
    >();

    for (const item of items) {
      const key = item.productId;
      const existing = productMap.get(key) ?? {
        product: item.product,
        totalQuantity: 0,
        totalRevenue: 0,
        orderCount: 0,
      };
      existing.totalQuantity += Number(item.quantity);
      existing.totalRevenue += Number(item.subtotal);
      existing.orderCount += 1;
      productMap.set(key, existing);
    }

    return Array.from(productMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);
  }

  async getInventoryRotation() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
        currentStock: true,
        costPrice: true,
        unit: true,
      },
    });

    const rotation = await Promise.all(
      products.map(async (product) => {
        const exits = await this.prisma.inventoryMovement.aggregate({
          where: {
            productId: product.id,
            type: { in: ['EXIT', 'PRODUCTION_OUT'] },
            createdAt: { gte: thirtyDaysAgo },
          },
          _sum: { quantity: true },
        });

        const totalExits = Number(exits._sum.quantity ?? 0);
        const currentStock = Number(product.currentStock);
        const rotationRate =
          currentStock > 0 ? totalExits / currentStock : 0;
        const daysOfStock =
          totalExits > 0 ? (currentStock / totalExits) * 30 : null;

        return {
          id: product.id,
          name: product.name,
          code: product.code,
          currentStock,
          exitsLast30Days: totalExits,
          rotationRate: Math.round(rotationRate * 100) / 100,
          daysOfStock: daysOfStock
            ? Math.round(daysOfStock)
            : null,
          inventoryValue: currentStock * Number(product.costPrice),
        };
      }),
    );

    return rotation.sort((a, b) => b.rotationRate - a.rotationRate);
  }

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalProducts,
      lowStockProducts,
      pendingSales,
      pendingPurchases,
      movementsToday,
      salesThisMonth,
      purchasesThisMonth,
      topProducts,
    ] = await Promise.all([
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.product.findMany({
        where: { isActive: true, minStock: { gt: 0 } },
      }),
      this.prisma.saleOrder.count({
        where: { status: { in: [SaleStatus.DRAFT, SaleStatus.CONFIRMED] } },
      }),
      this.prisma.purchaseOrder.count({
        where: {
          status: {
            in: [PurchaseStatus.DRAFT, PurchaseStatus.SENT, PurchaseStatus.CONFIRMED],
          },
        },
      }),
      this.prisma.inventoryMovement.count({
        where: { createdAt: { gte: today } },
      }),
      this.prisma.saleOrder.aggregate({
        where: {
          saleDate: { gte: monthStart },
          status: { not: SaleStatus.CANCELLED },
        },
        _sum: { total: true },
        _count: true,
      }),
      this.prisma.purchaseOrder.aggregate({
        where: {
          orderDate: { gte: monthStart },
          status: { not: PurchaseStatus.CANCELLED },
        },
        _sum: { total: true },
        _count: true,
      }),
      this.getTopProducts(5),
    ]);

    const lowStockCount = lowStockProducts.filter(
      (p) => Number(p.currentStock) <= Number(p.minStock),
    ).length;

    const [inventoryValue, productsWithCategory] = await Promise.all([
      this.prisma.product.findMany({
        where: { isActive: true },
        select: { currentStock: true, costPrice: true },
      }),
      this.prisma.product.findMany({
        where: { isActive: true },
        select: {
          currentStock: true,
          minStock: true,
          maxStock: true,
          category: { select: { name: true } },
        },
      }),
    ]);

    const totalInventoryValue = inventoryValue.reduce(
      (sum, p) => sum + Number(p.currentStock) * Number(p.costPrice),
      0,
    );

    // Stock by category for bar chart
    const categoryMap: Record<string, number> = {};
    for (const p of productsWithCategory) {
      const cat = p.category?.name ?? 'Sin categoría';
      categoryMap[cat] = (categoryMap[cat] ?? 0) + Number(p.currentStock);
    }
    const stockByCategory = Object.entries(categoryMap).map(([category, quantity]) => ({
      category,
      quantity,
    }));

    // Stock status counts for donut chart
    let stockNormal = 0, stockLow = 0, stockZero = 0, stockOver = 0;
    for (const p of productsWithCategory) {
      const curr = Number(p.currentStock);
      const min = Number(p.minStock ?? 0);
      const max = Number(p.maxStock ?? 0);
      if (curr === 0) stockZero++;
      else if (curr <= min) stockLow++;
      else if (max > 0 && curr > max) stockOver++;
      else stockNormal++;
    }

    return {
      totalProducts,
      lowStockCount,
      pendingSales,
      pendingPurchases,
      movementsToday,
      totalInventoryValue,
      stockByCategory,
      stockNormal,
      stockLow,
      stockZero,
      stockOver,
      salesThisMonth: {
        total: Number(salesThisMonth._sum.total ?? 0),
        count: salesThisMonth._count,
      },
      purchasesThisMonth: {
        total: Number(purchasesThisMonth._sum.total ?? 0),
        count: purchasesThisMonth._count,
      },
      topProducts,
    };
  }

  async exportToExcel(type: string, params: Record<string, any>) {
    // Return a placeholder Buffer - in production, integrate exceljs or similar
    // This structure shows the interface for PDF/Excel generation
    const data: any = {};

    switch (type) {
      case 'inventory':
        data.report = await this.getInventoryReport(params.warehouseId);
        break;
      case 'sales':
        data.report = await this.getSalesReport(params.from, params.to);
        break;
      case 'purchases':
        data.report = await this.getPurchasesReport(params.from, params.to);
        break;
      case 'top-products':
        data.report = await this.getTopProducts(
          Number(params.limit),
          params.from,
          params.to,
        );
        break;
      default:
        data.report = await this.getDashboardStats();
    }

    return data;
  }
}
