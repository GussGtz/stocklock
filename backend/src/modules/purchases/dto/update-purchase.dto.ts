import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { PurchaseStatus } from '@prisma/client';

export class UpdatePurchaseDto {
  @IsOptional()
  @IsDateString()
  expectedDate?: Date;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(PurchaseStatus)
  status?: PurchaseStatus;
}
