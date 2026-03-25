import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AlertType, AlertSeverity } from '@prisma/client';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  @Cron('0 */6 * * *')
  async checkLowStock() {
    this.logger.log('Running low stock check...');

    const products = await this.prisma.product.findMany({
      where: { isActive: true, minStock: { gt: 0 } },
    });

    const lowStockProducts = products.filter(
      (p) => Number(p.currentStock) <= Number(p.minStock),
    );

    for (const product of lowStockProducts) {
      const existingAlert = await this.prisma.alert.findFirst({
        where: {
          type: AlertType.LOW_STOCK,
          productId: product.id,
          isActive: true,
        },
      });

      if (!existingAlert) {
        const severity =
          Number(product.currentStock) === 0
            ? AlertSeverity.CRITICAL
            : AlertSeverity.WARNING;

        const alert = await this.prisma.alert.create({
          data: {
            type: AlertType.LOW_STOCK,
            severity,
            productId: product.id,
            title: `Low Stock: ${product.name}`,
            message: `Product ${product.code} has ${product.currentStock} ${product.unit} (min: ${product.minStock})`,
            threshold: product.minStock,
          },
        });

        // Notify all admins and managers
        const users = await this.prisma.user.findMany({
          where: {
            isActive: true,
            role: { in: ['ADMIN', 'MANAGER'] },
          },
          select: { id: true },
        });

        for (const user of users) {
          await this.prisma.alertNotification.create({
            data: { alertId: alert.id, userId: user.id },
          });

          this.eventEmitter.emit('alert.created', {
            alertId: alert.id,
            userId: user.id,
            type: alert.type,
            title: alert.title,
            message: alert.message,
            severity: alert.severity,
          });
        }
      }
    }

    // Deactivate alerts for products that are no longer low stock
    const activeAlerts = await this.prisma.alert.findMany({
      where: { type: AlertType.LOW_STOCK, isActive: true },
      include: { product: true },
    });

    for (const alert of activeAlerts) {
      if (
        alert.product &&
        Number(alert.product.currentStock) > Number(alert.product.minStock)
      ) {
        await this.prisma.alert.update({
          where: { id: alert.id },
          data: { isActive: false },
        });
      }
    }
  }

  @Cron('0 */6 * * *')
  async checkOverStock() {
    this.logger.log('Running over stock check...');

    const products = await this.prisma.product.findMany({
      where: { isActive: true, maxStock: { gt: 0 } },
    });

    const overStockProducts = products.filter(
      (p) => Number(p.currentStock) > Number(p.maxStock),
    );

    for (const product of overStockProducts) {
      const existingAlert = await this.prisma.alert.findFirst({
        where: {
          type: AlertType.OVER_STOCK,
          productId: product.id,
          isActive: true,
        },
      });

      if (!existingAlert) {
        const alert = await this.prisma.alert.create({
          data: {
            type: AlertType.OVER_STOCK,
            severity: AlertSeverity.INFO,
            productId: product.id,
            title: `Over Stock: ${product.name}`,
            message: `Product ${product.code} has ${product.currentStock} ${product.unit} (max: ${product.maxStock})`,
            threshold: product.maxStock,
          },
        });

        const users = await this.prisma.user.findMany({
          where: { isActive: true, role: { in: ['ADMIN', 'MANAGER'] } },
          select: { id: true },
        });

        for (const user of users) {
          await this.prisma.alertNotification.create({
            data: { alertId: alert.id, userId: user.id },
          });

          this.eventEmitter.emit('alert.created', {
            alertId: alert.id,
            userId: user.id,
            type: alert.type,
            title: alert.title,
            message: alert.message,
            severity: alert.severity,
          });
        }
      }
    }
  }

  @Cron('0 8 * * 1')
  async checkNoMovement() {
    this.logger.log('Running no movement check...');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeProducts = await this.prisma.product.findMany({
      where: { isActive: true, currentStock: { gt: 0 } },
      select: { id: true, name: true, code: true },
    });

    for (const product of activeProducts) {
      const recentMovement = await this.prisma.inventoryMovement.findFirst({
        where: {
          productId: product.id,
          createdAt: { gte: thirtyDaysAgo },
        },
      });

      if (!recentMovement) {
        const existingAlert = await this.prisma.alert.findFirst({
          where: {
            type: AlertType.NO_MOVEMENT,
            productId: product.id,
            isActive: true,
          },
        });

        if (!existingAlert) {
          const alert = await this.prisma.alert.create({
            data: {
              type: AlertType.NO_MOVEMENT,
              severity: AlertSeverity.INFO,
              productId: product.id,
              title: `No Movement: ${product.name}`,
              message: `Product ${product.code} has had no movement in the last 30 days`,
            },
          });

          const users = await this.prisma.user.findMany({
            where: { isActive: true, role: { in: ['ADMIN', 'MANAGER'] } },
            select: { id: true },
          });

          for (const user of users) {
            await this.prisma.alertNotification.create({
              data: { alertId: alert.id, userId: user.id },
            });
          }
        }
      }
    }
  }

  async getAlerts(userId: string) {
    const notifications = await this.prisma.alertNotification.findMany({
      where: { userId },
      include: {
        alert: {
          include: {
            product: { select: { id: true, name: true, code: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const unreadCount = notifications.filter((n) => !n.readAt).length;

    return {
      notifications,
      unreadCount,
    };
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.prisma.alertNotification.updateMany({
      where: { id: notificationId, userId },
      data: { readAt: new Date() },
    });
  }

  async dismissAlert(alertId: string) {
    return this.prisma.alert.update({
      where: { id: alertId },
      data: { isActive: false },
    });
  }
}
