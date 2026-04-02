import { IsEmail, IsOptional, IsString } from 'class-validator';

export class SendQuoteEmailDto {
  @IsEmail()
  to: string;

  @IsOptional()
  @IsString()
  cc?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  pdfBase64?: string;
}
