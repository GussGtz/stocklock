import {
  IsString,
  IsOptional,
  IsNumber,
  IsPositive,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProductionInputDto {
  @IsString()
  productId: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  plannedQty: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitCost: number;
}

export class ProductionOutputDto {
  @IsString()
  productId: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  plannedQty: number;
}

export class CreateProductionDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductionInputDto)
  inputs: ProductionInputDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductionOutputDto)
  outputs: ProductionOutputDto[];
}
