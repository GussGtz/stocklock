-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "contadigitalId" INTEGER,
ADD COLUMN     "regimenFiscal" TEXT,
ADD COLUMN     "usoCfdiDefault" TEXT DEFAULT 'G01',
ADD COLUMN     "zipCode" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "contadigitalIdProducto" INTEGER,
ADD COLUMN     "contadigitalIdUm" INTEGER;

-- AlterTable
ALTER TABLE "sale_orders" ADD COLUMN     "cfdiCancelledAt" TIMESTAMP(3),
ADD COLUMN     "cfdiId" INTEGER,
ADD COLUMN     "cfdiPdfUrl" TEXT,
ADD COLUMN     "cfdiSerie" TEXT,
ADD COLUMN     "cfdiStatus" TEXT,
ADD COLUMN     "cfdiUuid" TEXT,
ADD COLUMN     "cfdiXmlUrl" TEXT;

-- CreateTable
CREATE TABLE "cfdi_config" (
    "id" TEXT NOT NULL,
    "idEmpresa" INTEGER NOT NULL DEFAULT 0,
    "apiKey" TEXT NOT NULL DEFAULT '',
    "baseUrl" TEXT NOT NULL DEFAULT 'https://app.contadigital.mx/dev/pruebas',
    "idRfc" INTEGER NOT NULL DEFAULT 0,
    "idSerie" INTEGER NOT NULL DEFAULT 0,
    "idSucursal" INTEGER NOT NULL DEFAULT 0,
    "idLugarExpedicion" INTEGER NOT NULL DEFAULT 0,
    "lugarExpedicion" TEXT NOT NULL DEFAULT '',
    "idMoneda" INTEGER NOT NULL DEFAULT 1,
    "idFormaPago03" INTEGER NOT NULL DEFAULT 0,
    "idFormaPago04" INTEGER NOT NULL DEFAULT 0,
    "idFormaPago01" INTEGER NOT NULL DEFAULT 0,
    "idFormaPago99" INTEGER NOT NULL DEFAULT 0,
    "idUmKg" INTEGER NOT NULL DEFAULT 0,
    "idUmTon" INTEGER NOT NULL DEFAULT 0,
    "idUmMetro" INTEGER NOT NULL DEFAULT 0,
    "idUmPieza" INTEGER NOT NULL DEFAULT 0,
    "idUmRollo" INTEGER NOT NULL DEFAULT 0,
    "idUmLamina" INTEGER NOT NULL DEFAULT 0,
    "idUmBarra" INTEGER NOT NULL DEFAULT 0,
    "idUmTubo" INTEGER NOT NULL DEFAULT 0,
    "idUmPerfil" INTEGER NOT NULL DEFAULT 0,
    "idUmCaja" INTEGER NOT NULL DEFAULT 0,
    "idProductoDefault" INTEGER NOT NULL DEFAULT 0,
    "isConfigured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cfdi_config_pkey" PRIMARY KEY ("id")
);
