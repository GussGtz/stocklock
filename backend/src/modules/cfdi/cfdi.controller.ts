import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { CfdiService } from './cfdi.service';
import { UpdateCfdiConfigDto, GenerateInvoiceDto, CancelInvoiceDto } from './dto/cfdi-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../users/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cfdi')
export class CfdiController {
  constructor(private readonly cfdiService: CfdiService) {}

  // ── Config ──────────────────────────────────────────────────────────

  @Get('config')
  @Roles('ADMIN', 'MANAGER')
  getConfig() {
    return this.cfdiService.getConfig();
  }

  @Patch('config')
  @Roles('ADMIN')
  updateConfig(@Body() dto: UpdateCfdiConfigDto) {
    return this.cfdiService.updateConfig(dto);
  }

  @Get('config/test')
  @Roles('ADMIN', 'MANAGER')
  testConnection() {
    return this.cfdiService.testConnection();
  }

  @Get('utiles')
  @Roles('ADMIN', 'MANAGER')
  getUtiles() {
    return this.cfdiService.getUtiles();
  }

  // ── Per-Sale Invoice Actions ─────────────────────────────────────────

  @Post('sales/:saleId/invoice')
  @Roles('ADMIN', 'MANAGER', 'SALES')
  generateInvoice(
    @Param('saleId') saleId: string,
    @Body() dto: GenerateInvoiceDto,
  ) {
    return this.cfdiService.generateInvoice(saleId, dto);
  }

  @Delete('sales/:saleId/invoice')
  @Roles('ADMIN', 'MANAGER')
  cancelInvoice(
    @Param('saleId') saleId: string,
    @Body() dto: CancelInvoiceDto,
  ) {
    return this.cfdiService.cancelInvoice(saleId, dto);
  }

  @Get('sales/:saleId/invoice/files')
  @Roles('ADMIN', 'MANAGER', 'SALES')
  getInvoiceFiles(@Param('saleId') saleId: string) {
    return this.cfdiService.getInvoiceFiles(saleId);
  }

  @Post('sales/:saleId/invoice/email')
  @Roles('ADMIN', 'MANAGER', 'SALES')
  emailInvoice(
    @Param('saleId') saleId: string,
    @Query('email') email: string,
  ) {
    return this.cfdiService.emailInvoice(saleId, email);
  }

  // ── Customer Sync ────────────────────────────────────────────────────

  @Post('customers/:customerId/sync')
  @Roles('ADMIN', 'MANAGER')
  syncCustomer(@Param('customerId') customerId: string) {
    return this.cfdiService.syncCustomer(customerId);
  }
}
