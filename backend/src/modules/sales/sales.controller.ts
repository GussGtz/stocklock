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
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../users/decorators/roles.decorator';
import { SaleStatus } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: SaleStatus,
    @Query('customerId') customerId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.salesService.findAll({
      page: Number(page),
      limit: Number(limit),
      status,
      customerId,
      from,
      to,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.salesService.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'MANAGER', 'SALES')
  create(@Body() dto: CreateSaleDto, @Request() req: any) {
    return this.salesService.create(dto, req.user.id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER', 'SALES')
  update(@Param('id') id: string, @Body() dto: UpdateSaleDto) {
    return this.salesService.update(id, dto);
  }

  @Post(':id/confirm')
  @Roles('ADMIN', 'MANAGER', 'SALES')
  confirm(@Param('id') id: string, @Request() req: any) {
    return this.salesService.confirm(id, req.user.id);
  }

  @Post(':id/deliver')
  @Roles('ADMIN', 'MANAGER', 'WAREHOUSE', 'SALES')
  deliver(@Param('id') id: string, @Request() req: any) {
    return this.salesService.deliver(id, req.user.id);
  }

  @Post(':id/cancel')
  @Roles('ADMIN', 'MANAGER')
  cancel(@Param('id') id: string, @Request() req: any) {
    return this.salesService.cancel(id, req.user.id);
  }
}
