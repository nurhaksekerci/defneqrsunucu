-- CreateTable
CREATE TABLE "appointment_products" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "stockQuantity" INTEGER,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "appointment_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_sales" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "customerId" TEXT,
    "soldAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "product_sales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "appointment_products_businessId_idx" ON "appointment_products"("businessId");
CREATE INDEX "appointment_products_isDeleted_idx" ON "appointment_products"("isDeleted");

-- CreateIndex
CREATE INDEX "product_sales_productId_idx" ON "product_sales"("productId");
CREATE INDEX "product_sales_soldAt_idx" ON "product_sales"("soldAt");

-- AddForeignKey
ALTER TABLE "appointment_products" ADD CONSTRAINT "appointment_products_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "appointment_businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_sales" ADD CONSTRAINT "product_sales_productId_fkey" FOREIGN KEY ("productId") REFERENCES "appointment_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
