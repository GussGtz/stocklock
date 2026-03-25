import { IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AdjustStockDto {
  @IsString()
  productId: string;

  @IsString()
  warehouseId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  newQuantity: number;

  @IsString()
  reason: string;
}
