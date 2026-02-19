-- CreateIndex
CREATE INDEX "categories_restaurantId_idx" ON "categories"("restaurantId");

-- CreateIndex
CREATE INDEX "categories_isGlobal_idx" ON "categories"("isGlobal");

-- CreateIndex
CREATE INDEX "categories_isDeleted_idx" ON "categories"("isDeleted");

-- CreateIndex
CREATE INDEX "categories_order_idx" ON "categories"("order");

-- CreateIndex
CREATE INDEX "categories_restaurantId_isDeleted_isGlobal_idx" ON "categories"("restaurantId", "isDeleted", "isGlobal");

-- CreateIndex
CREATE INDEX "orders_restaurantId_idx" ON "orders"("restaurantId");

-- CreateIndex
CREATE INDEX "orders_tableId_idx" ON "orders"("tableId");

-- CreateIndex
CREATE INDEX "orders_waiterId_idx" ON "orders"("waiterId");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_isDeleted_idx" ON "orders"("isDeleted");

-- CreateIndex
CREATE INDEX "orders_createdAt_idx" ON "orders"("createdAt");

-- CreateIndex
CREATE INDEX "orders_restaurantId_status_isDeleted_idx" ON "orders"("restaurantId", "status", "isDeleted");

-- CreateIndex
CREATE INDEX "orders_tableId_status_idx" ON "orders"("tableId", "status");

-- CreateIndex
CREATE INDEX "payments_restaurantId_idx" ON "payments"("restaurantId");

-- CreateIndex
CREATE INDEX "payments_orderId_idx" ON "payments"("orderId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_isDeleted_idx" ON "payments"("isDeleted");

-- CreateIndex
CREATE INDEX "payments_createdAt_idx" ON "payments"("createdAt");

-- CreateIndex
CREATE INDEX "payments_restaurantId_status_isDeleted_idx" ON "payments"("restaurantId", "status", "isDeleted");

-- CreateIndex
CREATE INDEX "products_categoryId_idx" ON "products"("categoryId");

-- CreateIndex
CREATE INDEX "products_restaurantId_idx" ON "products"("restaurantId");

-- CreateIndex
CREATE INDEX "products_isGlobal_idx" ON "products"("isGlobal");

-- CreateIndex
CREATE INDEX "products_isActive_idx" ON "products"("isActive");

-- CreateIndex
CREATE INDEX "products_isDeleted_idx" ON "products"("isDeleted");

-- CreateIndex
CREATE INDEX "products_order_idx" ON "products"("order");

-- CreateIndex
CREATE INDEX "products_restaurantId_categoryId_isDeleted_idx" ON "products"("restaurantId", "categoryId", "isDeleted");

-- CreateIndex
CREATE INDEX "products_isGlobal_isActive_isDeleted_idx" ON "products"("isGlobal", "isActive", "isDeleted");

-- CreateIndex
CREATE INDEX "restaurants_ownerId_idx" ON "restaurants"("ownerId");

-- CreateIndex
CREATE INDEX "restaurants_isDeleted_idx" ON "restaurants"("isDeleted");

-- CreateIndex
CREATE INDEX "restaurants_createdAt_idx" ON "restaurants"("createdAt");

-- CreateIndex
CREATE INDEX "restaurants_slug_isDeleted_idx" ON "restaurants"("slug", "isDeleted");

-- CreateIndex
CREATE INDEX "stocks_restaurantId_idx" ON "stocks"("restaurantId");

-- CreateIndex
CREATE INDEX "stocks_productId_idx" ON "stocks"("productId");

-- CreateIndex
CREATE INDEX "stocks_isDeleted_idx" ON "stocks"("isDeleted");

-- CreateIndex
CREATE INDEX "stocks_quantity_idx" ON "stocks"("quantity");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_isDeleted_idx" ON "users"("isDeleted");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex
CREATE INDEX "users_email_isDeleted_idx" ON "users"("email", "isDeleted");
