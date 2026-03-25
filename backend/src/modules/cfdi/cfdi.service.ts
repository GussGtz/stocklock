import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContadigitalApiService } from './contadigital-api.service';
import { UpdateCfdiConfigDto, GenerateInvoiceDto, CancelInvoiceDto } from './dto/cfdi-config.dto';
import { ProductUnit, SaleStatus } from '@prisma/client';

// RFC genérico SAT para "Público en General"
const RFC_PUBLICO_GENERAL = 'XAXX010101000';
const REGIMEN_SIN_OBLIGACIONES = '616';
const USO_SIN_EFECTOS = 'S01';

/**
 * Mapea ProductUnit → campo idUm de CfdiConfig
 */
const UNIT_FIELD_MAP: Record<ProductUnit, keyof any> = {
  KG:      'idUmKg',
  TON:     'idUmTon',
  METER:   'idUmMetro',
  PIECE:   'idUmPieza',
  ROLL:    'idUmRollo',
  SHEET:   'idUmLamina',
  BAR:     'idUmBarra',
  TUBE:    'idUmTubo',
  PROFILE: 'idUmPerfil',
  BOX:     'idUmCaja',
};

@Injectable()
export class CfdiService {
  private readonly logger = new Logger(CfdiService.name);

  constructor(
    private prisma: PrismaService,
    private cdApi: ContadigitalApiService,
  ) {}

  // ── Config ──────────────────────────────────────────────────────────

  async getConfig() {
    let cfg = await this.prisma.cfdiConfig.findFirst();
    if (!cfg) {
      cfg = await this.prisma.cfdiConfig.create({ data: {} });
    }
    // Mask apiKey for frontend
    return { ...cfg, apiKey: cfg.apiKey ? '••••••••' : '' };
  }

  async getRawConfig() {
    let cfg = await this.prisma.cfdiConfig.findFirst();
    if (!cfg) cfg = await this.prisma.cfdiConfig.create({ data: {} });
    return cfg;
  }

  async updateConfig(dto: UpdateCfdiConfigDto) {
    const existing = await this.getRawConfig();

    // If new apiKey is the masked placeholder, keep the existing one
    const apiKey =
      dto.apiKey && dto.apiKey !== '••••••••'
        ? dto.apiKey
        : existing.apiKey;

    // Invalidate cached token when credentials change
    if (dto.apiKey && dto.apiKey !== '••••••••') {
      this.cdApi.invalidateToken({
        apiKey: existing.apiKey,
        baseUrl: dto.baseUrl ?? existing.baseUrl,
      });
    }

    const updated = await this.prisma.cfdiConfig.update({
      where: { id: existing.id },
      data: { ...dto, apiKey },
    });

    return { ...updated, apiKey: updated.apiKey ? '••••••••' : '' };
  }

  // ── ContaDigital Utilities (catálogos) ──────────────────────────────

  async getUtiles() {
    const cfg = await this.getRawConfig();
    this.assertConfigured(cfg);
    return this.cdApi.get(
      `/api/cfdi/utiles.json/${cfg.idEmpresa}`,
      { apiKey: cfg.apiKey, baseUrl: cfg.baseUrl },
    );
  }

  async testConnection() {
    const cfg = await this.getRawConfig();
    this.assertConfigured(cfg);
    const token = await this.cdApi.getToken({ apiKey: cfg.apiKey, baseUrl: cfg.baseUrl });
    return { ok: true, hasToken: !!token };
  }

  // ── Customer Sync ────────────────────────────────────────────────────

  /**
   * Busca el cliente en ContaDigital por RFC. Si no existe, lo crea.
   * Actualiza contadigitalId en nuestra BD.
   * Devuelve el ID de ContaDigital.
   */
  async syncCustomer(customerId: string): Promise<number> {
    const cfg = await this.getRawConfig();
    this.assertConfigured(cfg);
    const apiCfg = { apiKey: cfg.apiKey, baseUrl: cfg.baseUrl };

    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) throw new NotFoundException(`Customer ${customerId} not found`);

    // Determine RFC (use generic if null)
    const rfc = customer.rfc?.trim().toUpperCase() || RFC_PUBLICO_GENERAL;
    const isPublicoGeneral = rfc === RFC_PUBLICO_GENERAL;

    // 1. Check if we already have the ContaDigital ID cached
    if (customer.contadigitalId) {
      return customer.contadigitalId;
    }

    // 2. Try to find in ContaDigital by RFC
    try {
      const found = await this.cdApi.get<any>(
        `/api/clientes.json/${cfg.idEmpresa}/${rfc}`,
        apiCfg,
      );
      // ContaDigital wraps responses in { Resultado: ..., Codigo: N }
      const cliente = found?.Resultado ?? found;
      if (cliente?.Id) {
        // Activate client if inactive
        if (cliente.Estatus === false) {
          await this.cdApi.put<any>('/api/clientes.json', { ...cliente, Estatus: true }, apiCfg);
        }
        await this.prisma.customer.update({
          where: { id: customerId },
          data: { contadigitalId: cliente.Id },
        });
        return cliente.Id as number;
      }
    } catch (e) {
      this.logger.warn(`[syncCustomer] GET failed: ${e?.message}`);
      // Not found or error → proceed to create
    }

    // 3. Create in ContaDigital
    const regimenFiscal = isPublicoGeneral
      ? REGIMEN_SIN_OBLIGACIONES
      : (customer.regimenFiscal || '601');

    const usoCfdi = isPublicoGeneral
      ? USO_SIN_EFECTOS
      : (customer.usoCfdiDefault || 'G01');

    const payload: Record<string, any> = {
      IdEmpresaCliente: cfg.idEmpresa,
      RFC: rfc,
      RazonSocial: customer.name,
      RegimenFiscal: regimenFiscal,
      Email: customer.email || '',
      UsoCFDIDefault: usoCfdi,
      CP: customer.zipCode || cfg.lugarExpedicion || '00000',
      IdFormaPagoDefault: cfg.idFormaPago03 || 0,
      Contacto: customer.contactName || customer.name,
      Calle: customer.address || 'S/N',
      Ciudad: customer.city || '',
      Pais: customer.country || 'México',
      Estatus: true,
    };

    const created = await this.cdApi.post<any>('/api/clientes.json', payload, apiCfg);
    const newCliente = created?.Resultado ?? created;
    if (!newCliente?.Id) {
      throw new BadRequestException(
        `ContaDigital no pudo crear cliente: ${JSON.stringify(created)}`,
      );
    }

    await this.prisma.customer.update({
      where: { id: customerId },
      data: { contadigitalId: newCliente.Id },
    });

    return newCliente.Id as number;
  }

  // ── Generate CFDI ────────────────────────────────────────────────────

  async generateInvoice(saleOrderId: string, dto: GenerateInvoiceDto = {}) {
    const cfg = await this.getRawConfig();
    this.assertConfigured(cfg);
    const apiCfg = { apiKey: cfg.apiKey, baseUrl: cfg.baseUrl };

    // 1. Load sale order
    const order = await this.prisma.saleOrder.findUnique({
      where: { id: saleOrderId },
      include: {
        customer: true,
        items: {
          include: {
            product: {
              select: {
                id: true, name: true, code: true, unit: true,
                contadigitalIdProducto: true, contadigitalIdUm: true,
              },
            },
          },
        },
      },
    });

    if (!order) throw new NotFoundException(`Sale order ${saleOrderId} not found`);
    if (order.cfdiUuid) throw new BadRequestException('Esta venta ya tiene una factura emitida');
    if (!['CONFIRMED', 'DELIVERED'].includes(order.status)) {
      throw new BadRequestException(
        `Solo se pueden facturar órdenes CONFIRMADAS o ENTREGADAS. Estado actual: ${order.status}`,
      );
    }

    // 2. Sync customer → get ContaDigital client ID
    const idCliente = await this.syncCustomer(order.customerId);

    // 3. Build DetalleFactura lines
    const porcentajeIva = 16;
    const productos = order.items.map((item) => {
      const qty = Number(item.quantity);
      const price = Number(item.unitPrice);
      const discPct = Number(item.discount) || 0;
      const importe = +(qty * price * (1 - discPct / 100)).toFixed(2);
      const discMonto = +(qty * price * (discPct / 100)).toFixed(2);
      const iva = +(importe * (porcentajeIva / 100)).toFixed(2);
      const total = +(importe + iva).toFixed(2);

      // Use product's ContaDigital ID, fall back to config default
      const idProducto =
        item.product.contadigitalIdProducto || cfg.idProductoDefault;

      if (!idProducto) {
        throw new BadRequestException(
          `El producto "${item.product.name}" no tiene IdProducto de ContaDigital. ` +
          'Configura el idProductoDefault en la configuración CFDI o asigna uno al producto.',
        );
      }

      // Map unit → ContaDigital UM ID
      const umField = UNIT_FIELD_MAP[item.product.unit] as string;
      const idUm =
        item.product.contadigitalIdUm ||
        (umField ? (cfg as any)[umField] : 0) ||
        0;

      if (!idUm) {
        throw new BadRequestException(
          `No hay IdUM configurado para la unidad "${item.product.unit}". ` +
          'Configura los IDs de unidades de medida en la configuración CFDI.',
        );
      }

      return {
        IdProducto: idProducto,
        IdUM: idUm,
        Cantidad: qty,
        Precio: price,
        Descuento: discMonto,
        PorcentajeIVA: porcentajeIva,
        IVA: iva,
        TasaCero: false,
        TasaIEPS: 0,
        ImporteIEPS: 0,
        BaseRetIVA: 0,
        TipoRetIVA: 0,
        RetIVA: 0,
        TasaISR: 0,
        RetISR: 0,
        Importe: importe,
        Total: total,
        Comentarios: `${item.product.code} - ${item.product.name}`,
        ClaveIdentificacion: item.product.code,
      };
    });

    const subtotal = +Number(order.subtotal).toFixed(2);
    const discount = +Number(order.discount).toFixed(2);
    const iva = +Number(order.tax).toFixed(2);
    const total = +Number(order.total).toFixed(2);

    const isPublicoGeneral =
      (order.customer.rfc?.trim().toUpperCase() || RFC_PUBLICO_GENERAL) ===
      RFC_PUBLICO_GENERAL;

    const usoCfdi =
      dto.usoCfdi ||
      (isPublicoGeneral ? USO_SIN_EFECTOS : order.customer.usoCfdiDefault || 'G01');

    const metodoPago = dto.metodoPago || 'PUE';
    const idFormaPago = dto.idFormaPago || cfg.idFormaPago03;
    const formaPago =
      dto.formaPago ||
      (idFormaPago === cfg.idFormaPago03
        ? '03 Transferencia electrónica de fondos'
        : idFormaPago === cfg.idFormaPago01
        ? '01 Efectivo'
        : idFormaPago === cfg.idFormaPago04
        ? '04 Tarjeta de crédito'
        : '99 Por definir');

    // 4. Build CFDI request
    const fecha = this.formatCdDate(new Date());
    const cfdiReq = {
      Id: 0,
      IdEmpresa: cfg.idEmpresa,
      IdRFC: cfg.idRfc,
      FolioOriginal: order.folio,
      Fecha: fecha,
      TipoComprobante: 'Factura', // ContaDigital usa "Factura" no "I"
      IdSerie: cfg.idSerie,
      IdSucursal: cfg.idSucursal,
      IdLugarDeExpedicion: cfg.idLugarExpedicion,
      LugarDeExpedicion: cfg.lugarExpedicion,
      IdCliente: idCliente,
      IdSucursalCliente: 0,
      UsoCFDI: usoCfdi,
      TipoRelacion: 0,
      CFDIRelacionados: null, // [] causa error interno en ContaDigital; null es correcto
      TipoDeCambio: Number(order.exchangeRate),
      IdMoneda: cfg.idMoneda,
      IdBanco: 0,
      MetodoDePago: metodoPago,
      IdFormaDePago: idFormaPago,
      FormaDePago: formaPago,
      Descuento: discount,
      PorcentajeIVA: porcentajeIva,
      IVA: iva,
      RetencionISR: 0,
      TipoRetencionIVA: 0,
      RetencionIVA: 0,
      IEPS: 0,
      TotalImpuestosLocalesRetenidos: 0,
      TotalImpuestosLocalesTrasladados: 0,
      Subtotal: subtotal,
      Total: total,
      Productos: productos,
      AgregarLeyendasFiscales: false,
      TipoComplementoAddenda: 0,
      SoloGuardar: false,
    };

    this.logger.log(`[CFDI] Timbrar factura para orden ${order.folio}`);
    this.logger.log(`[CFDI] Payload: ${JSON.stringify(cfdiReq)}`);

    // 5. Stamp the CFDI
    const response = await this.cdApi.post<any>('/api/cfdi.json', cfdiReq, apiCfg);

    // Codigo 3 = guardada pero sin créditos para timbrar
    if (response?.Codigo === 3) {
      throw new BadRequestException(
        `Factura guardada en ContaDigital (Id: ${response.Resultado?.Id}) pero ` +
        `sin créditos disponibles para timbrar. Recargue créditos en ContaDigital y reintente.`,
      );
    }

    if (!response?.Resultado?.UUID) {
      throw new BadRequestException(
        `ContaDigital no regresó UUID: ${JSON.stringify(response)}`,
      );
    }

    const resultado = response.Resultado;

    // 6. Persist CFDI data
    const updated = await this.prisma.saleOrder.update({
      where: { id: saleOrderId },
      data: {
        cfdiId: resultado.Id ?? null,
        cfdiUuid: resultado.UUID,
        cfdiSerie: resultado.Serie ?? null,
        cfdiStatus: 'VIGENTE',
        cfdiXmlUrl: resultado.XmlLink ?? resultado.UrlXml ?? null,
        cfdiPdfUrl: resultado.PdfLink ?? resultado.UrlPdf ?? null,
        invoiceNo: `${resultado.Serie ?? ''}${resultado.Folio ?? ''}`,
        status: SaleStatus.INVOICED,
      },
    });

    return {
      sale: updated,
      uuid: resultado.UUID,
      serie: resultado.Serie,
      folio: resultado.Folio,
      xmlUrl: resultado.XmlLink ?? resultado.UrlXml,
      pdfUrl: resultado.PdfLink ?? resultado.UrlPdf,
      xmlBase64: resultado.XmlBase64,
      pdfBase64: resultado.PdfBase64,
    };
  }

  // ── Cancel CFDI ──────────────────────────────────────────────────────

  async cancelInvoice(saleOrderId: string, dto: CancelInvoiceDto) {
    const cfg = await this.getRawConfig();
    this.assertConfigured(cfg);
    const apiCfg = { apiKey: cfg.apiKey, baseUrl: cfg.baseUrl };

    const order = await this.prisma.saleOrder.findUnique({
      where: { id: saleOrderId },
    });
    if (!order) throw new NotFoundException(`Sale order ${saleOrderId} not found`);
    if (!order.cfdiUuid || !order.cfdiId) {
      throw new BadRequestException('Esta orden no tiene una factura emitida');
    }
    if (order.cfdiStatus === 'CANCELADO') {
      throw new BadRequestException('La factura ya está cancelada');
    }

    const cancelReq: Record<string, any> = {
      IdEmpresa: cfg.idEmpresa,
      IdFactura: order.cfdiId,
      Motivo: dto.motivo,
    };
    if (dto.uuidSustitucion) {
      cancelReq.UUIDSustitucion = dto.uuidSustitucion;
    }

    this.logger.log(`[CFDI] Cancelar factura ${order.cfdiUuid} motivo=${dto.motivo}`);

    const response = await this.cdApi.delete<any>('/api/cfdi.json', cancelReq, apiCfg);

    if (!response?.Resultado) {
      throw new BadRequestException(
        `ContaDigital cancelación falló: ${JSON.stringify(response)}`,
      );
    }

    const updated = await this.prisma.saleOrder.update({
      where: { id: saleOrderId },
      data: {
        cfdiStatus: 'CANCELADO',
        cfdiCancelledAt: new Date(),
        status: SaleStatus.DELIVERED, // revert to DELIVERED if needed
      },
    });

    return {
      sale: updated,
      acuseBase64: response.Resultado.AcuseBase64 ?? null,
    };
  }

  // ── Get CFDI Files ───────────────────────────────────────────────────

  async getInvoiceFiles(saleOrderId: string) {
    const cfg = await this.getRawConfig();
    this.assertConfigured(cfg);
    const apiCfg = { apiKey: cfg.apiKey, baseUrl: cfg.baseUrl };

    const order = await this.prisma.saleOrder.findUnique({
      where: { id: saleOrderId },
    });
    if (!order) throw new NotFoundException(`Sale order ${saleOrderId} not found`);
    if (!order.cfdiId) throw new BadRequestException('Esta orden no tiene factura');

    const res = await this.cdApi.get<any>(
      `/api/cfdi/factura.json/${cfg.idEmpresa}/${order.cfdiId}`,
      apiCfg,
    );
    const factura = res?.Resultado ?? res;

    return {
      uuid: order.cfdiUuid,
      xmlUrl: factura.XmlLink ?? factura.UrlXml ?? order.cfdiXmlUrl,
      pdfUrl: factura.PdfLink ?? factura.UrlPdf ?? order.cfdiPdfUrl,
      xmlBase64: factura.XmlBase64,
      pdfBase64: factura.PdfBase64,
      status: order.cfdiStatus,
    };
  }

  // ── Email CFDI ───────────────────────────────────────────────────────

  async emailInvoice(saleOrderId: string, email: string) {
    const cfg = await this.getRawConfig();
    this.assertConfigured(cfg);
    const apiCfg = { apiKey: cfg.apiKey, baseUrl: cfg.baseUrl };

    const order = await this.prisma.saleOrder.findUnique({
      where: { id: saleOrderId },
    });
    if (!order) throw new NotFoundException(`Sale order ${saleOrderId} not found`);
    if (!order.cfdiId) throw new BadRequestException('Esta orden no tiene factura');

    await this.cdApi.get(
      `/api/cfdi/enviar.json/${cfg.idEmpresa}/${order.cfdiId}/${email}`,
      apiCfg,
    );

    return { ok: true, sentTo: email };
  }

  // ── Helpers ──────────────────────────────────────────────────────────

  private assertConfigured(cfg: any) {
    if (!cfg.apiKey || !cfg.idEmpresa) {
      throw new BadRequestException(
        'La configuración CFDI no está completa. ' +
        'Configura IdEmpresa y ApiKey en Ajustes → Facturación CFDI.',
      );
    }
    if (!cfg.lugarExpedicion) {
      throw new BadRequestException(
        'Falta el Código Postal Fiscal (LugarExpedicion) en la configuración CFDI. ' +
        'Agrégalo en Ajustes → Facturación CFDI → CP Fiscal del Emisor.',
      );
    }
  }

  /** ContaDigital date format: "dd-MM-yyyy HH:mm:ss" */
  private formatCdDate(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}` +
           ` ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
}
