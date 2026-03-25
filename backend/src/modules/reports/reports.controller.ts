import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../users/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  getDashboard() {
    return this.reportsService.getDashboardStats();
  }

  @Get('inventory')
  @Roles('ADMIN', 'MANAGER', 'WAREHOUSE')
  getInventory(@Query('warehouseId') warehouseId?: string) {
    return this.reportsService.getInventoryReport(warehouseId);
  }

  @Get('sales')
  @Roles('ADMIN', 'MANAGER', 'SALES')
  getSales(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reportsService.getSalesReport(from ?? '', to ?? '');
  }

  @Get('purchases')
  @Roles('ADMIN', 'MANAGER')
  getPurchases(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reportsService.getPurchasesReport(from ?? '', to ?? '');
  }

  @Get('top-products')
  @Roles('ADMIN', 'MANAGER', 'SALES')
  getTopProducts(
    @Query('limit') limit?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.getTopProducts(Number(limit) || 10, from, to);
  }

  @Get('rotation')
  @Roles('ADMIN', 'MANAGER', 'WAREHOUSE')
  getRotation() {
    return this.reportsService.getInventoryRotation();
  }

  @Get('export/:type')
  @Roles('ADMIN', 'MANAGER')
  exportExcel(
    @Param('type') type: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reportsService.exportToExcel(type, {
      from,
      to,
      warehouseId,
      limit,
    });
  }
}
