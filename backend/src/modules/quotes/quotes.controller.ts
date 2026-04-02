import {
  Controller, Get, Post, Patch, Param, Body,
  Query, Request, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../users/decorators/roles.decorator';
import { QuoteStatus } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Get()
  findAll(
    @Query('page')       page?: string,
    @Query('limit')      limit?: string,
    @Query('status')     status?: QuoteStatus,
    @Query('customerId') customerId?: string,
    @Query('from')       from?: string,
    @Query('to')         to?: string,
  ) {
    return this.quotesService.findAll({ page: Number(page), limit: Number(limit), status, customerId, from, to });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.quotesService.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'MANAGER', 'SALES')
  create(@Body() dto: CreateQuoteDto, @Request() req: any) {
    return this.quotesService.create(dto, req.user.id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER', 'SALES')
  update(@Param('id') id: string, @Body() dto: UpdateQuoteDto) {
    return this.quotesService.update(id, dto);
  }

  @Post(':id/send')
  @Roles('ADMIN', 'MANAGER', 'SALES')
  @HttpCode(HttpStatus.OK)
  send(@Param('id') id: string) {
    return this.quotesService.send(id);
  }

  @Post(':id/approve')
  @Roles('ADMIN', 'MANAGER')
  @HttpCode(HttpStatus.OK)
  approve(@Param('id') id: string) {
    return this.quotesService.approve(id);
  }

  @Post(':id/reject')
  @Roles('ADMIN', 'MANAGER', 'SALES')
  @HttpCode(HttpStatus.OK)
  reject(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.quotesService.reject(id, reason);
  }

  @Post(':id/convert')
  @Roles('ADMIN', 'MANAGER', 'SALES')
  @HttpCode(HttpStatus.OK)
  convertToSale(@Param('id') id: string, @Request() req: any) {
    return this.quotesService.convertToSale(id, req.user.id);
  }

  @Post(':id/expire')
  @Roles('ADMIN', 'MANAGER')
  @HttpCode(HttpStatus.OK)
  expire(@Param('id') id: string) {
    return this.quotesService.expire(id);
  }
}
