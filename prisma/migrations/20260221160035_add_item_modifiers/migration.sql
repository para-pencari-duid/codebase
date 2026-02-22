/*
  Warnings:

  - You are about to drop the column `productId` on the `StockMovement` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `TransactionItem` table. All the data in the column will be lost.
  - You are about to drop the column `productName` on the `TransactionItem` table. All the data in the column will be lost.
  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Product` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[tenantId]` on the table `Settings` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,transactionNo]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,email]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tenantId` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `Settings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `StockMovement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `variantId` to the `StockMovement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `itemName` to the `TransactionItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `variantId` to the `TransactionItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `variantName` to the `TransactionItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('GOODS', 'SERVICE', 'RAW_MATERIAL', 'BUNDLE');

-- CreateEnum
CREATE TYPE "ProductionStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'READY', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DeliveryType" AS ENUM ('PICKUP', 'DELIVERY');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('POS_RECEIPT', 'B2B_INVOICE');

-- CreateEnum
CREATE TYPE "InvoicePaymentStatus" AS ENUM ('PAID', 'PARTIAL', 'UNPAID');

-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('RETAIL', 'WHOLESALE');

-- CreateEnum
CREATE TYPE "PointActionType" AS ENUM ('EARN', 'REDEEM', 'EXPIRE', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PAID', 'UNPAID', 'PARTIAL');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('SALARY', 'UTILITIES', 'RAW_MATERIALS', 'SUPPLIES', 'RENT', 'MAINTENANCE', 'MARKETING', 'TRANSPORTATION', 'TAX_FEE', 'OTHER');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('LOW_STOCK', 'OUT_OF_STOCK', 'NEW_ORDER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ShiftStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "ReturnStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "OpnameStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('PENDING', 'APPROVED', 'IN_TRANSIT', 'RECEIVED', 'REJECTED');

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "StockMovement" DROP CONSTRAINT "StockMovement_productId_fkey";

-- DropForeignKey
ALTER TABLE "TransactionItem" DROP CONSTRAINT "TransactionItem_productId_fkey";

-- DropIndex
DROP INDEX "StockMovement_createdAt_idx";

-- DropIndex
DROP INDEX "StockMovement_productId_idx";

-- DropIndex
DROP INDEX "Transaction_createdAt_idx";

-- DropIndex
DROP INDEX "Transaction_transactionNo_idx";

-- DropIndex
DROP INDEX "Transaction_transactionNo_key";

-- DropIndex
DROP INDEX "TransactionItem_productId_idx";

-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "creditLimit" DECIMAL(10,2),
ADD COLUMN     "customerType" "CustomerType" NOT NULL DEFAULT 'RETAIL',
ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "lowStockThreshold" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "notifyDailyReport" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notifyOnBackup" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyOnLowStock" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyOnTransaction" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ownerPhone" TEXT,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "whatsappConnected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "whatsappLastConnected" TIMESTAMP(3),
ADD COLUMN     "whatsappTenantId" TEXT;

-- AlterTable
ALTER TABLE "StockMovement" DROP COLUMN "productId",
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "variantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "paymentStatus" "InvoicePaymentStatus" NOT NULL DEFAULT 'PAID',
ADD COLUMN     "shiftId" TEXT,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "type" "TransactionType" NOT NULL DEFAULT 'POS_RECEIPT',
ALTER COLUMN "paymentMethod" DROP NOT NULL,
ALTER COLUMN "paymentAmount" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "TransactionItem" DROP COLUMN "productId",
DROP COLUMN "productName",
ADD COLUMN     "itemName" TEXT NOT NULL,
ADD COLUMN     "variantId" TEXT NOT NULL,
ADD COLUMN     "variantName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Category";

-- DropTable
DROP TABLE "Product";

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "activeModules" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemCategory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "ItemType" NOT NULL DEFAULT 'GOODS',
    "categoryId" TEXT,
    "images" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "basePrice" DECIMAL(10,2) NOT NULL,
    "baseCost" DECIMAL(10,2),
    "unit" TEXT NOT NULL DEFAULT 'pcs',
    "taxable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemVariant" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "cost" DECIMAL(10,2),
    "stock" INTEGER NOT NULL DEFAULT 0,
    "minStock" INTEGER NOT NULL DEFAULT 10,
    "barcode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "attributes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillOfMaterial" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "notes" TEXT,
    "yield" DECIMAL(10,3) NOT NULL DEFAULT 1,
    "yieldUnit" TEXT NOT NULL DEFAULT 'pcs',
    "prepTime" INTEGER,
    "cookTime" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillOfMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BomItem" (
    "id" TEXT NOT NULL,
    "bomId" TEXT NOT NULL,
    "componentItemId" TEXT NOT NULL,
    "variantId" TEXT,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BomItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionOrder" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderNo" TEXT NOT NULL,
    "status" "ProductionStatus" NOT NULL DEFAULT 'PLANNED',
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "totalCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionOrderItem" (
    "id" TEXT NOT NULL,
    "productionId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "variantName" TEXT NOT NULL,
    "targetQuantity" INTEGER NOT NULL,
    "producedQuantity" INTEGER NOT NULL DEFAULT 0,
    "wasteQuantity" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "ProductionOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionMaterial" (
    "id" TEXT NOT NULL,
    "productionId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "materialName" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "cost" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "ProductionMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobTicket" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ticketNo" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerAddress" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "notes" TEXT,
    "referenceImages" TEXT[],
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "dpAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "dpMethod" "PaymentMethod",
    "dpPaidAt" TIMESTAMP(3),
    "remainingAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "finalPayMethod" "PaymentMethod",
    "finalPaidAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3) NOT NULL,
    "deliveryType" "DeliveryType" NOT NULL DEFAULT 'PICKUP',
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "cancelReason" TEXT,
    "createdBy" TEXT NOT NULL,
    "customerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobTicketItem" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "variantId" TEXT,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "JobTicketItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemModifierGroup" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "multiple" BOOLEAN NOT NULL DEFAULT true,
    "maxSelect" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemModifierGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemModifierOption" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ItemModifierOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionItemModifier" (
    "id" TEXT NOT NULL,
    "transactionItemId" TEXT NOT NULL,
    "modifierGroupName" TEXT NOT NULL,
    "modifierOptionName" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "TransactionItemModifier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemBatch" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "batchNo" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "remainingQty" INTEGER NOT NULL,
    "manufactureDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "cost" DECIMAL(10,2) NOT NULL,
    "supplier" TEXT,
    "notes" TEXT,
    "discountRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyPoint" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "totalEarned" INTEGER NOT NULL DEFAULT 0,
    "totalSpent" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointHistory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "type" "PointActionType" NOT NULL,
    "reference" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "contactName" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "purchaseNo" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "tax" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseItem" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "variantName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "PurchaseItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Discount" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "type" "DiscountType" NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "minPurchase" DECIMAL(10,2),
    "maxDiscount" DECIMAL(10,2),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageLimit" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Discount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "attachments" TEXT[],
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "shiftNo" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storeId" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "status" "ShiftStatus" NOT NULL DEFAULT 'OPEN',
    "openingBalance" DECIMAL(10,2) NOT NULL,
    "closingBalance" DECIMAL(10,2),
    "actualCash" DECIMAL(10,2),
    "variance" DECIMAL(10,2),
    "totalSales" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalCash" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalTransfer" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalQris" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalCard" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "transactionCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Return" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "returnNo" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "transactionNo" TEXT NOT NULL,
    "customerId" TEXT,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ReturnStatus" NOT NULL DEFAULT 'PENDING',
    "subtotal" DECIMAL(10,2) NOT NULL,
    "refundAmount" DECIMAL(10,2) NOT NULL,
    "refundMethod" "PaymentMethod" NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Return_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnItem" (
    "id" TEXT NOT NULL,
    "returnId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "variantName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "returnToStock" BOOLEAN NOT NULL DEFAULT true,
    "condition" TEXT,

    CONSTRAINT "ReturnItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockOpname" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "opnameNo" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "status" "OpnameStatus" NOT NULL DEFAULT 'SCHEDULED',
    "storeId" TEXT,
    "countedBy" TEXT,
    "verifiedBy" TEXT,
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "totalVariance" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockOpname_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockOpnameItem" (
    "id" TEXT NOT NULL,
    "opnameId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "variantName" TEXT NOT NULL,
    "systemStock" INTEGER NOT NULL,
    "countedStock" INTEGER NOT NULL DEFAULT 0,
    "variance" INTEGER NOT NULL DEFAULT 0,
    "reason" TEXT,
    "condition" TEXT,
    "adjusted" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "StockOpnameItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "manager" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isMainStore" BOOLEAN NOT NULL DEFAULT false,
    "settings" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreInventory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "minStock" INTEGER NOT NULL DEFAULT 10,
    "maxStock" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreTransfer" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "transferNo" TEXT NOT NULL,
    "fromStoreId" TEXT NOT NULL,
    "toStoreId" TEXT NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'PENDING',
    "requestedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "receivedBy" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreTransferItem" (
    "id" TEXT NOT NULL,
    "transferId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "variantName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "receivedQty" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "StoreTransferItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ItemToItemModifierGroup" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ItemToItemModifierGroup_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE INDEX "Tenant_slug_idx" ON "Tenant"("slug");

-- CreateIndex
CREATE INDEX "Tenant_isActive_idx" ON "Tenant"("isActive");

-- CreateIndex
CREATE INDEX "ItemCategory_tenantId_idx" ON "ItemCategory"("tenantId");

-- CreateIndex
CREATE INDEX "ItemCategory_name_idx" ON "ItemCategory"("name");

-- CreateIndex
CREATE INDEX "Item_tenantId_idx" ON "Item"("tenantId");

-- CreateIndex
CREATE INDEX "Item_tenantId_type_idx" ON "Item"("tenantId", "type");

-- CreateIndex
CREATE INDEX "Item_categoryId_idx" ON "Item"("categoryId");

-- CreateIndex
CREATE INDEX "Item_name_idx" ON "Item"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Item_tenantId_sku_key" ON "Item"("tenantId", "sku");

-- CreateIndex
CREATE INDEX "ItemVariant_tenantId_isActive_idx" ON "ItemVariant"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "ItemVariant_tenantId_barcode_idx" ON "ItemVariant"("tenantId", "barcode");

-- CreateIndex
CREATE INDEX "ItemVariant_itemId_idx" ON "ItemVariant"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemVariant_tenantId_sku_key" ON "ItemVariant"("tenantId", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "BillOfMaterial_itemId_key" ON "BillOfMaterial"("itemId");

-- CreateIndex
CREATE INDEX "BillOfMaterial_tenantId_idx" ON "BillOfMaterial"("tenantId");

-- CreateIndex
CREATE INDEX "BillOfMaterial_itemId_idx" ON "BillOfMaterial"("itemId");

-- CreateIndex
CREATE INDEX "BomItem_bomId_idx" ON "BomItem"("bomId");

-- CreateIndex
CREATE INDEX "BomItem_componentItemId_idx" ON "BomItem"("componentItemId");

-- CreateIndex
CREATE INDEX "BomItem_variantId_idx" ON "BomItem"("variantId");

-- CreateIndex
CREATE INDEX "ProductionOrder_tenantId_idx" ON "ProductionOrder"("tenantId");

-- CreateIndex
CREATE INDEX "ProductionOrder_status_idx" ON "ProductionOrder"("status");

-- CreateIndex
CREATE INDEX "ProductionOrder_scheduledDate_idx" ON "ProductionOrder"("scheduledDate");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionOrder_tenantId_orderNo_key" ON "ProductionOrder"("tenantId", "orderNo");

-- CreateIndex
CREATE INDEX "ProductionOrderItem_productionId_idx" ON "ProductionOrderItem"("productionId");

-- CreateIndex
CREATE INDEX "ProductionOrderItem_variantId_idx" ON "ProductionOrderItem"("variantId");

-- CreateIndex
CREATE INDEX "ProductionMaterial_productionId_idx" ON "ProductionMaterial"("productionId");

-- CreateIndex
CREATE INDEX "ProductionMaterial_variantId_idx" ON "ProductionMaterial"("variantId");

-- CreateIndex
CREATE INDEX "JobTicket_tenantId_status_idx" ON "JobTicket"("tenantId", "status");

-- CreateIndex
CREATE INDEX "JobTicket_tenantId_dueDate_idx" ON "JobTicket"("tenantId", "dueDate" ASC);

-- CreateIndex
CREATE INDEX "JobTicket_tenantId_customerPhone_idx" ON "JobTicket"("tenantId", "customerPhone");

-- CreateIndex
CREATE INDEX "JobTicket_createdAt_idx" ON "JobTicket"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "JobTicket_tenantId_ticketNo_key" ON "JobTicket"("tenantId", "ticketNo");

-- CreateIndex
CREATE INDEX "JobTicketItem_ticketId_idx" ON "JobTicketItem"("ticketId");

-- CreateIndex
CREATE INDEX "JobTicketItem_variantId_idx" ON "JobTicketItem"("variantId");

-- CreateIndex
CREATE INDEX "ItemModifierGroup_tenantId_idx" ON "ItemModifierGroup"("tenantId");

-- CreateIndex
CREATE INDEX "ItemModifierGroup_tenantId_isActive_idx" ON "ItemModifierGroup"("tenantId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ItemModifierGroup_tenantId_name_key" ON "ItemModifierGroup"("tenantId", "name");

-- CreateIndex
CREATE INDEX "ItemModifierOption_groupId_idx" ON "ItemModifierOption"("groupId");

-- CreateIndex
CREATE INDEX "TransactionItemModifier_transactionItemId_idx" ON "TransactionItemModifier"("transactionItemId");

-- CreateIndex
CREATE INDEX "ItemBatch_tenantId_idx" ON "ItemBatch"("tenantId");

-- CreateIndex
CREATE INDEX "ItemBatch_variantId_idx" ON "ItemBatch"("variantId");

-- CreateIndex
CREATE INDEX "ItemBatch_expiryDate_idx" ON "ItemBatch"("expiryDate");

-- CreateIndex
CREATE UNIQUE INDEX "ItemBatch_tenantId_batchNo_key" ON "ItemBatch"("tenantId", "batchNo");

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyPoint_customerId_key" ON "LoyaltyPoint"("customerId");

-- CreateIndex
CREATE INDEX "LoyaltyPoint_tenantId_idx" ON "LoyaltyPoint"("tenantId");

-- CreateIndex
CREATE INDEX "LoyaltyPoint_customerId_idx" ON "LoyaltyPoint"("customerId");

-- CreateIndex
CREATE INDEX "PointHistory_tenantId_idx" ON "PointHistory"("tenantId");

-- CreateIndex
CREATE INDEX "PointHistory_customerId_idx" ON "PointHistory"("customerId");

-- CreateIndex
CREATE INDEX "PointHistory_createdAt_idx" ON "PointHistory"("createdAt");

-- CreateIndex
CREATE INDEX "Supplier_tenantId_idx" ON "Supplier"("tenantId");

-- CreateIndex
CREATE INDEX "Supplier_name_idx" ON "Supplier"("name");

-- CreateIndex
CREATE INDEX "Purchase_tenantId_idx" ON "Purchase"("tenantId");

-- CreateIndex
CREATE INDEX "Purchase_supplierId_idx" ON "Purchase"("supplierId");

-- CreateIndex
CREATE INDEX "Purchase_createdAt_idx" ON "Purchase"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_tenantId_purchaseNo_key" ON "Purchase"("tenantId", "purchaseNo");

-- CreateIndex
CREATE INDEX "PurchaseItem_purchaseId_idx" ON "PurchaseItem"("purchaseId");

-- CreateIndex
CREATE INDEX "PurchaseItem_variantId_idx" ON "PurchaseItem"("variantId");

-- CreateIndex
CREATE INDEX "Discount_tenantId_idx" ON "Discount"("tenantId");

-- CreateIndex
CREATE INDEX "Discount_isActive_idx" ON "Discount"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Discount_tenantId_code_key" ON "Discount"("tenantId", "code");

-- CreateIndex
CREATE INDEX "Expense_tenantId_date_idx" ON "Expense"("tenantId", "date" DESC);

-- CreateIndex
CREATE INDEX "Expense_tenantId_category_date_idx" ON "Expense"("tenantId", "category", "date");

-- CreateIndex
CREATE INDEX "Notification_tenantId_idx" ON "Notification"("tenantId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Shift_tenantId_idx" ON "Shift"("tenantId");

-- CreateIndex
CREATE INDEX "Shift_userId_idx" ON "Shift"("userId");

-- CreateIndex
CREATE INDEX "Shift_storeId_idx" ON "Shift"("storeId");

-- CreateIndex
CREATE INDEX "Shift_status_idx" ON "Shift"("status");

-- CreateIndex
CREATE INDEX "Shift_openedAt_idx" ON "Shift"("openedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Shift_tenantId_shiftNo_key" ON "Shift"("tenantId", "shiftNo");

-- CreateIndex
CREATE INDEX "Return_tenantId_idx" ON "Return"("tenantId");

-- CreateIndex
CREATE INDEX "Return_transactionId_idx" ON "Return"("transactionId");

-- CreateIndex
CREATE INDEX "Return_userId_idx" ON "Return"("userId");

-- CreateIndex
CREATE INDEX "Return_status_idx" ON "Return"("status");

-- CreateIndex
CREATE INDEX "Return_createdAt_idx" ON "Return"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Return_tenantId_returnNo_key" ON "Return"("tenantId", "returnNo");

-- CreateIndex
CREATE INDEX "ReturnItem_returnId_idx" ON "ReturnItem"("returnId");

-- CreateIndex
CREATE INDEX "ReturnItem_variantId_idx" ON "ReturnItem"("variantId");

-- CreateIndex
CREATE INDEX "StockOpname_tenantId_idx" ON "StockOpname"("tenantId");

-- CreateIndex
CREATE INDEX "StockOpname_status_idx" ON "StockOpname"("status");

-- CreateIndex
CREATE INDEX "StockOpname_storeId_idx" ON "StockOpname"("storeId");

-- CreateIndex
CREATE INDEX "StockOpname_scheduledDate_idx" ON "StockOpname"("scheduledDate");

-- CreateIndex
CREATE UNIQUE INDEX "StockOpname_tenantId_opnameNo_key" ON "StockOpname"("tenantId", "opnameNo");

-- CreateIndex
CREATE INDEX "StockOpnameItem_opnameId_idx" ON "StockOpnameItem"("opnameId");

-- CreateIndex
CREATE INDEX "StockOpnameItem_variantId_idx" ON "StockOpnameItem"("variantId");

-- CreateIndex
CREATE INDEX "Store_tenantId_idx" ON "Store"("tenantId");

-- CreateIndex
CREATE INDEX "Store_isActive_idx" ON "Store"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Store_tenantId_code_key" ON "Store"("tenantId", "code");

-- CreateIndex
CREATE INDEX "StoreInventory_tenantId_idx" ON "StoreInventory"("tenantId");

-- CreateIndex
CREATE INDEX "StoreInventory_storeId_idx" ON "StoreInventory"("storeId");

-- CreateIndex
CREATE INDEX "StoreInventory_variantId_idx" ON "StoreInventory"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "StoreInventory_storeId_variantId_key" ON "StoreInventory"("storeId", "variantId");

-- CreateIndex
CREATE INDEX "StoreTransfer_tenantId_idx" ON "StoreTransfer"("tenantId");

-- CreateIndex
CREATE INDEX "StoreTransfer_fromStoreId_idx" ON "StoreTransfer"("fromStoreId");

-- CreateIndex
CREATE INDEX "StoreTransfer_toStoreId_idx" ON "StoreTransfer"("toStoreId");

-- CreateIndex
CREATE INDEX "StoreTransfer_status_idx" ON "StoreTransfer"("status");

-- CreateIndex
CREATE UNIQUE INDEX "StoreTransfer_tenantId_transferNo_key" ON "StoreTransfer"("tenantId", "transferNo");

-- CreateIndex
CREATE INDEX "StoreTransferItem_transferId_idx" ON "StoreTransferItem"("transferId");

-- CreateIndex
CREATE INDEX "StoreTransferItem_variantId_idx" ON "StoreTransferItem"("variantId");

-- CreateIndex
CREATE INDEX "_ItemToItemModifierGroup_B_index" ON "_ItemToItemModifierGroup"("B");

-- CreateIndex
CREATE INDEX "Customer_tenantId_idx" ON "Customer"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Settings_tenantId_key" ON "Settings"("tenantId");

-- CreateIndex
CREATE INDEX "Settings_tenantId_idx" ON "Settings"("tenantId");

-- CreateIndex
CREATE INDEX "StockMovement_tenantId_variantId_createdAt_idx" ON "StockMovement"("tenantId", "variantId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "StockMovement_tenantId_type_createdAt_idx" ON "StockMovement"("tenantId", "type", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "StockMovement_variantId_idx" ON "StockMovement"("variantId");

-- CreateIndex
CREATE INDEX "Transaction_tenantId_createdAt_idx" ON "Transaction"("tenantId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Transaction_tenantId_type_createdAt_idx" ON "Transaction"("tenantId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "Transaction_tenantId_status_idx" ON "Transaction"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Transaction_tenantId_paymentStatus_idx" ON "Transaction"("tenantId", "paymentStatus");

-- CreateIndex
CREATE INDEX "Transaction_shiftId_idx" ON "Transaction"("shiftId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_tenantId_transactionNo_key" ON "Transaction"("tenantId", "transactionNo");

-- CreateIndex
CREATE INDEX "TransactionItem_variantId_idx" ON "TransactionItem"("variantId");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "User_tenantId_email_key" ON "User"("tenantId", "email");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemCategory" ADD CONSTRAINT "ItemCategory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ItemCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemVariant" ADD CONSTRAINT "ItemVariant_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillOfMaterial" ADD CONSTRAINT "BillOfMaterial_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BomItem" ADD CONSTRAINT "BomItem_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "BillOfMaterial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BomItem" ADD CONSTRAINT "BomItem_componentItemId_fkey" FOREIGN KEY ("componentItemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BomItem" ADD CONSTRAINT "BomItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ItemVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionOrder" ADD CONSTRAINT "ProductionOrder_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionOrderItem" ADD CONSTRAINT "ProductionOrderItem_productionId_fkey" FOREIGN KEY ("productionId") REFERENCES "ProductionOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionMaterial" ADD CONSTRAINT "ProductionMaterial_productionId_fkey" FOREIGN KEY ("productionId") REFERENCES "ProductionOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobTicket" ADD CONSTRAINT "JobTicket_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobTicket" ADD CONSTRAINT "JobTicket_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobTicket" ADD CONSTRAINT "JobTicket_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobTicketItem" ADD CONSTRAINT "JobTicketItem_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "JobTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionItem" ADD CONSTRAINT "TransactionItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ItemVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemModifierGroup" ADD CONSTRAINT "ItemModifierGroup_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemModifierOption" ADD CONSTRAINT "ItemModifierOption_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ItemModifierGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionItemModifier" ADD CONSTRAINT "TransactionItemModifier_transactionItemId_fkey" FOREIGN KEY ("transactionItemId") REFERENCES "TransactionItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ItemVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemBatch" ADD CONSTRAINT "ItemBatch_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ItemVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyPoint" ADD CONSTRAINT "LoyaltyPoint_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointHistory" ADD CONSTRAINT "PointHistory_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ItemVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discount" ADD CONSTRAINT "Discount_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Return" ADD CONSTRAINT "Return_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnItem" ADD CONSTRAINT "ReturnItem_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "Return"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnItem" ADD CONSTRAINT "ReturnItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ItemVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockOpname" ADD CONSTRAINT "StockOpname_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockOpname" ADD CONSTRAINT "StockOpname_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockOpnameItem" ADD CONSTRAINT "StockOpnameItem_opnameId_fkey" FOREIGN KEY ("opnameId") REFERENCES "StockOpname"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockOpnameItem" ADD CONSTRAINT "StockOpnameItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ItemVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreInventory" ADD CONSTRAINT "StoreInventory_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreInventory" ADD CONSTRAINT "StoreInventory_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ItemVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreTransfer" ADD CONSTRAINT "StoreTransfer_fromStoreId_fkey" FOREIGN KEY ("fromStoreId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreTransfer" ADD CONSTRAINT "StoreTransfer_toStoreId_fkey" FOREIGN KEY ("toStoreId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreTransferItem" ADD CONSTRAINT "StoreTransferItem_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "StoreTransfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreTransferItem" ADD CONSTRAINT "StoreTransferItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ItemVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ItemToItemModifierGroup" ADD CONSTRAINT "_ItemToItemModifierGroup_A_fkey" FOREIGN KEY ("A") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ItemToItemModifierGroup" ADD CONSTRAINT "_ItemToItemModifierGroup_B_fkey" FOREIGN KEY ("B") REFERENCES "ItemModifierGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
