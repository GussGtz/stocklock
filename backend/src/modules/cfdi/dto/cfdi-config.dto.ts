import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class UpdateCfdiConfigDto {
  @IsOptional() @IsNumber() idEmpresa?: number;
  @IsOptional() @IsString() apiKey?: string;
  @IsOptional() @IsString() baseUrl?: string;
  @IsOptional() @IsNumber() idRfc?: number;
  @IsOptional() @IsNumber() idSerie?: number;
  @IsOptional() @IsNumber() idSucursal?: number;
  @IsOptional() @IsNumber() idLugarExpedicion?: number;
  @IsOptional() @IsString() lugarExpedicion?: string;
  @IsOptional() @IsNumber() idMoneda?: number;
  @IsOptional() @IsNumber() idFormaPago03?: number;
  @IsOptional() @IsNumber() idFormaPago04?: number;
  @IsOptional() @IsNumber() idFormaPago01?: number;
  @IsOptional() @IsNumber() idFormaPago99?: number;
  @IsOptional() @IsNumber() idUmKg?: number;
  @IsOptional() @IsNumber() idUmTon?: number;
  @IsOptional() @IsNumber() idUmMetro?: number;
  @IsOptional() @IsNumber() idUmPieza?: number;
  @IsOptional() @IsNumber() idUmRollo?: number;
  @IsOptional() @IsNumber() idUmLamina?: number;
  @IsOptional() @IsNumber() idUmBarra?: number;
  @IsOptional() @IsNumber() idUmTubo?: number;
  @IsOptional() @IsNumber() idUmPerfil?: number;
  @IsOptional() @IsNumber() idUmCaja?: number;
  @IsOptional() @IsNumber() idProductoDefault?: number;
  @IsOptional() @IsBoolean() isConfigured?: boolean;
}

export class GenerateInvoiceDto {
  @IsOptional() @IsString() metodoPago?: string;      // PUE | PPD (default PUE)
  @IsOptional() @IsNumber() idFormaPago?: number;      // override forma de pago
  @IsOptional() @IsString() formaPago?: string;        // descripción
  @IsOptional() @IsString() usoCfdi?: string;          // override uso CFDI del cliente
}

export class CancelInvoiceDto {
  @IsString() motivo: string;                          // "01"|"02"|"03"|"04"
  @IsOptional() @IsString() uuidSustitucion?: string;  // solo si motivo="01"
}
