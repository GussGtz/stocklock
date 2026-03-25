-- AlterTable
ALTER TABLE "products" ADD COLUMN     "aluminumTypeId" TEXT,
ADD COLUMN     "sectorId" TEXT;

-- CreateTable
CREATE TABLE "aluminum_sectors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '🔩',
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aluminum_sectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aluminum_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sectorId" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aluminum_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "aluminum_sectors_name_key" ON "aluminum_sectors"("name");

-- CreateIndex
CREATE INDEX "aluminum_types_sectorId_idx" ON "aluminum_types"("sectorId");

-- CreateIndex
CREATE UNIQUE INDEX "aluminum_types_name_sectorId_key" ON "aluminum_types"("name", "sectorId");

-- AddForeignKey
ALTER TABLE "aluminum_types" ADD CONSTRAINT "aluminum_types_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "aluminum_sectors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "aluminum_sectors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_aluminumTypeId_fkey" FOREIGN KEY ("aluminumTypeId") REFERENCES "aluminum_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
