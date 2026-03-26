import { IsString, IsOptional, IsEnum } from 'class-validator';
import { SaleStatus } from '@prisma/client';

export class UpdateSaleDto {
  @IsOptional()
  @IsString()
  deliveryDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  invoiceNo?: string;

  @IsOptional()
  @IsEnum(SaleStatus)
  status?: SaleStatus;
}
