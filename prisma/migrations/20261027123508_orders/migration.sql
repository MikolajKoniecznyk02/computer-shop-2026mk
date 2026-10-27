-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Order" (
    "id" SERIAL NOT NULL,
    "number" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "totalPrice" BIGINT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "productId" INTEGER,
    "productCode" VARCHAR(10) NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "lineTotal" BIGINT NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_number_key" ON "Order"("number");

-- CreateIndex
CREATE INDEX "Order_userId_createdAt_idx" ON "Order"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderItem_orderId_position_key" ON "OrderItem"("orderId", "position");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OrderItem"
  ADD CONSTRAINT "orderitem_quantity_positive" CHECK ("quantity" > 0);

ALTER TABLE "OrderItem"
  ADD CONSTRAINT "orderitem_unitprice_nonnegative" CHECK ("unitPrice" >= 0);

ALTER TABLE "OrderItem"
  ADD CONSTRAINT "orderitem_position_positive" CHECK ("position" > 0);

-- wartość pozycji musi zgadzać się z ceną i ilością
ALTER TABLE "OrderItem"
  ADD CONSTRAINT "orderitem_linetotal_consistent"
  CHECK ("lineTotal" = "unitPrice"::bigint * "quantity"::bigint);

ALTER TABLE "Order"
  ADD CONSTRAINT "order_total_nonnegative" CHECK ("totalPrice" >= 0);

ALTER TABLE "Order"
  ADD CONSTRAINT "order_number_format" CHECK ("number" ~ '^ZAM-[0-9]{4}-[0-9]{4}$');