import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { ReceivePurchaseDto } from './dto/receive-purchase.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../users/decorators/roles.decorator';
import { PurchaseStatus } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: PurchaseStatus,
    @Query('supplierId') supplierId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.purchasesService.findAll({
      page: Number(page),
      limit: Number(limit),
      status,
      supplierId,
      from,
      to,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.purchasesService.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'MANAGER')
  create(@Body() dto: CreatePurchaseDto, @Request() req: any) {
    return this.purchasesService.create(dto, req.user.id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER')
  update(@Param('id') id: string, @Body() dto: UpdatePurchaseDto) {
    return this.purchasesService.update(id, dto);
  }

  @Post(':id/receive')
  @Roles('ADMIN', 'MANAGER', 'WAREHOUSE')
  receive(
    @Param('id') id: string,
    @Body() dto: ReceivePurchaseDto,
    @Request() req: any,
  ) {
    return this.purchasesService.receive(id, dto, req.user.id);
  }

  @Post(':id/cancel')
  @Roles('ADMIN', 'MANAGER')
  cancel(@Param('id') id: string, @Request() req: any) {
    return this.purchasesService.cancel(id, req.user.id);
  }
}
