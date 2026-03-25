import {
  IsString,
  IsOptional,
  IsNumber,
  IsPositive,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ReceiveItemDto {
  @IsString()
  itemId: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  receivedQty: number;

  @IsOptional()
  @IsString()
  lotNumber?: string;
}

export class ReceivePurchaseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiveItemDto)
  items: ReceiveItemDto[];

  @IsString()
  warehouseId: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
