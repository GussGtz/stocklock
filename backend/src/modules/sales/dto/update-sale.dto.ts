import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { SaleStatus } from '@prisma/client';

export class UpdateSaleDto {
  @IsOptional()
  @IsDateString()
  deliveryDate?: Date;

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
