import { IsString, IsOptional, IsDateString } from 'class-validator';

export class UpdateQuoteDto {
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  currency?: string;
}
