import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateMovementDto } from './dto/create-movement.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { TransferStockDto } from './dto/transfer-stock.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../users/decorators/roles.decorator';
import { MovementType } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('summary')
  getSummary() {
    return this.inventoryService.getSummary();
  }

  @Get('movements')
  getMovements(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: MovementType,
    @Query('productId') productId?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.inventoryService.getMovements({
      page: Number(page),
      limit: Number(limit),
      type,
      productId,
      warehouseId,
      from,
      to,
    });
  }

  @Get('kardex/:productId')
  getKardex(
    @Param('productId') productId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.inventoryService.getKardex(productId, from, to);
  }

  @Get('stock/:productId')
  getCurrentStock(
    @Param('productId') productId: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.inventoryService.getCurrentStock(productId, warehouseId);
  }

  @Post('movements')
  @Roles('ADMIN', 'MANAGER', 'WAREHOUSE')
  createMovement(@Body() dto: CreateMovementDto, @Request() req: any) {
    return this.inventoryService.createMovement(dto, req.user.id);
  }

  @Post('adjust')
  @Roles('ADMIN', 'MANAGER')
  adjustStock(@Body() dto: AdjustStockDto, @Request() req: any) {
    return this.inventoryService.adjustStock(
      dto.productId,
      dto.warehouseId,
      dto.newQuantity,
      dto.reason,
      req.user.id,
    );
  }

  @Post('transfer')
  @Roles('ADMIN', 'MANAGER', 'WAREHOUSE')
  transferStock(@Body() dto: TransferStockDto, @Request() req: any) {
    return this.inventoryService.transferStock(
      dto.fromWarehouseId,
      dto.toWarehouseId,
      dto.productId,
      dto.quantity,
      req.user.id,
      dto.notes,
    );
  }
}
