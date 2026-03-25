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
import { ProductionService } from './production.service';
import { CreateProductionDto } from './dto/create-production.dto';
import { CompleteProductionDto } from './dto/complete-production.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../users/decorators/roles.decorator';
import { ProductionStatus } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('production')
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: ProductionStatus,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.productionService.findAll({
      page: Number(page),
      limit: Number(limit),
      status,
      from,
      to,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productionService.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'MANAGER')
  create(@Body() dto: CreateProductionDto, @Request() req: any) {
    return this.productionService.create(dto, req.user.id);
  }

  @Post(':id/start')
  @Roles('ADMIN', 'MANAGER', 'WAREHOUSE')
  start(@Param('id') id: string, @Request() req: any) {
    return this.productionService.start(id, req.user.id);
  }

  @Post(':id/complete')
  @Roles('ADMIN', 'MANAGER', 'WAREHOUSE')
  complete(
    @Param('id') id: string,
    @Body() dto: CompleteProductionDto,
    @Request() req: any,
  ) {
    return this.productionService.complete(id, req.user.id, dto);
  }

  @Post(':id/cancel')
  @Roles('ADMIN', 'MANAGER')
  cancel(@Param('id') id: string, @Request() req: any) {
    return this.productionService.cancel(id, req.user.id);
  }
}
