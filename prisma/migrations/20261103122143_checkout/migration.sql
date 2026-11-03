/*
  Warnings:

  - A unique constraint covering the columns `[userId,requestKey]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "requestKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_userId_requestKey_key" ON "Order"("userId", "requestKey");

ALTER TABLE "Order"
  ADD CONSTRAINT "order_requestkey_format"
  CHECK ("requestKey" IS NULL OR "requestKey" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');

-- Numery zamówień ZAM-RRRR-NNNN; start od 1000, żeby nie kolidować z demo (0001-0004).
-- MAXVALUE 9999 pasuje do CHECK formatu numeru; po wyczerpaniu nextval zgłosi błąd.
CREATE SEQUENCE "order_number_seq" START WITH 1000 MINVALUE 1000 MAXVALUE 9999 NO CYCLE;