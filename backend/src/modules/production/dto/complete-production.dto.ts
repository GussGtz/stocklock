import {
  IsString,
  IsOptional,
  IsNumber,
  IsPositive,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CompleteOutputDto {
  @IsString()
  outputId: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  producedQty: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  scrapQty?: number;
}

export class CompleteProductionDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompleteOutputDto)
  outputs: CompleteOutputDto[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsString()
  warehouseId: string;
}
