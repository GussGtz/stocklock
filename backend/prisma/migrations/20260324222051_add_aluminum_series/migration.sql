-- AlterTable
ALTER TABLE "products" ADD COLUMN     "seriesId" TEXT;

-- CreateTable
CREATE TABLE "aluminum_series" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "principalAlloy" TEXT,
    "description" TEXT,
    "applications" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aluminum_series_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "aluminum_series_code_key" ON "aluminum_series"("code");

-- CreateIndex
CREATE UNIQUE INDEX "aluminum_series_name_key" ON "aluminum_series"("name");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "aluminum_series"("id") ON DELETE SET NULL ON UPDATE CASCADE;
