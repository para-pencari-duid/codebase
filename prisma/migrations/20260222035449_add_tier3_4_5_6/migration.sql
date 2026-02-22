-- CreateEnum
CREATE TYPE "ConsignmentStatus" AS ENUM ('ACTIVE', 'SETTLED', 'RETURNED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SerialNumberStatus" AS ENUM ('IN_STOCK', 'SOLD', 'RETURNED', 'DEFECTIVE', 'RESERVED');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "BalanceSide" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "BankTxType" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'HOLIDAY', 'LEAVE');

-- CreateEnum
CREATE TYPE "PayrollStatus" AS ENUM ('DRAFT', 'PROCESSED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('WHATSAPP', 'EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RecipientStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('MONTHLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('UNPAID', 'PAID', 'OVERDUE', 'CANCELLED');

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "priceListId" TEXT,
ADD COLUMN     "segment" TEXT;

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "serialTrack" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "taxRateId" TEXT;

-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "accountingEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "bankReconEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "consignmentEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "feedbackEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "marketingEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "onlineOrderEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "payrollEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "serialTrackEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tierPricingEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "webhooksEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "PriceList" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "minOrderQty" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceListItem" (
    "id" TEXT NOT NULL,
    "priceListId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "minQty" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "PriceListItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consignment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "consignNo" TEXT NOT NULL,
    "consignerName" TEXT NOT NULL,
    "consignerPhone" TEXT,
    "supplierId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" "ConsignmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "commission" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsignmentItem" (
    "id" TEXT NOT NULL,
    "consignmentId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "variantName" TEXT NOT NULL,
    "consignedQty" INTEGER NOT NULL,
    "soldQty" INTEGER NOT NULL DEFAULT 0,
    "returnedQty" INTEGER NOT NULL DEFAULT 0,
    "consignPrice" DECIMAL(10,2) NOT NULL,
    "salePrice" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsignmentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SerialNumber" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "serialNo" TEXT NOT NULL,
    "status" "SerialNumberStatus" NOT NULL DEFAULT 'IN_STOCK',
    "purchaseRef" TEXT,
    "transactionId" TEXT,
    "customerId" TEXT,
    "soldAt" TIMESTAMP(3),
    "returnedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SerialNumber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "normalBalance" "BalanceSide" NOT NULL DEFAULT 'DEBIT',
    "parentId" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "currentBalance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "entryNo" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "reference" TEXT,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "isPosted" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalLine" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "description" TEXT,
    "debit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "JournalLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankAccount" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "currentBalance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankStatement" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "bankAccountId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "type" "BankTxType" NOT NULL,
    "reference" TEXT,
    "balance" DECIMAL(15,2),
    "isReconciled" BOOLEAN NOT NULL DEFAULT false,
    "transactionId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankStatement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxRate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "rate" DECIMAL(5,2) NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isInclusive" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "employeeNo" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" TEXT,
    "department" TEXT,
    "joinDate" TIMESTAMP(3) NOT NULL,
    "baseSalary" DECIMAL(15,2) NOT NULL,
    "bankName" TEXT,
    "bankAccount" TEXT,
    "bankHolder" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "checkIn" TIMESTAMP(3),
    "checkOut" TIMESTAMP(3),
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollPeriod" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "PayrollStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "processedBy" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollEntry" (
    "id" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "workingDays" INTEGER NOT NULL DEFAULT 0,
    "presentDays" INTEGER NOT NULL DEFAULT 0,
    "baseSalary" DECIMAL(15,2) NOT NULL,
    "allowances" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "deductions" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "netSalary" DECIMAL(15,2) NOT NULL,
    "bankName" TEXT,
    "bankAccount" TEXT,
    "status" "PayrollStatus" NOT NULL DEFAULT 'DRAFT',
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingCampaign" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CampaignType" NOT NULL,
    "targetSegment" TEXT,
    "message" TEXT NOT NULL,
    "imageUrl" TEXT,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "totalRecipients" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignRecipient" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "customerId" TEXT,
    "name" TEXT,
    "contact" TEXT NOT NULL,
    "status" "RecipientStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "errorMsg" TEXT,

    CONSTRAINT "CampaignRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerFeedback" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT,
    "transactionId" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'LINK',
    "staffName" TEXT,
    "storeId" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEndpoint" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "events" TEXT[],
    "secret" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookEndpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookLog" (
    "id" TEXT NOT NULL,
    "endpointId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "responseCode" INTEGER,
    "responseBody" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "nextRetryAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceIntegration" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "shopId" TEXT,
    "shopName" TEXT,
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "accessToken" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncAt" TIMESTAMP(3),
    "syncStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceOrder" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "externalOrderId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "items" TEXT NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "shippingFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "transactionId" TEXT,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "priceMonthly" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "priceAnnual" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "features" TEXT[],
    "maxUsers" INTEGER NOT NULL DEFAULT 5,
    "maxStores" INTEGER NOT NULL DEFAULT 1,
    "maxItems" INTEGER NOT NULL DEFAULT 500,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantSubscription" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "interval" "BillingInterval" NOT NULL DEFAULT 'MONTHLY',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "trialEndsAt" TIMESTAMP(3),
    "nextBillingDate" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingInvoice" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "invoiceNo" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'UNPAID',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "paymentRef" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "role" "Role",
    "userId" TEXT,
    "resource" TEXT NOT NULL,
    "actions" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PriceList_tenantId_isActive_idx" ON "PriceList"("tenantId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PriceList_tenantId_name_key" ON "PriceList"("tenantId", "name");

-- CreateIndex
CREATE INDEX "PriceListItem_priceListId_idx" ON "PriceListItem"("priceListId");

-- CreateIndex
CREATE INDEX "PriceListItem_variantId_idx" ON "PriceListItem"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "PriceListItem_priceListId_variantId_key" ON "PriceListItem"("priceListId", "variantId");

-- CreateIndex
CREATE INDEX "Consignment_tenantId_status_idx" ON "Consignment"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Consignment_tenantId_consignNo_key" ON "Consignment"("tenantId", "consignNo");

-- CreateIndex
CREATE INDEX "ConsignmentItem_consignmentId_idx" ON "ConsignmentItem"("consignmentId");

-- CreateIndex
CREATE INDEX "ConsignmentItem_variantId_idx" ON "ConsignmentItem"("variantId");

-- CreateIndex
CREATE INDEX "SerialNumber_tenantId_status_idx" ON "SerialNumber"("tenantId", "status");

-- CreateIndex
CREATE INDEX "SerialNumber_variantId_idx" ON "SerialNumber"("variantId");

-- CreateIndex
CREATE INDEX "SerialNumber_transactionId_idx" ON "SerialNumber"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "SerialNumber_tenantId_serialNo_key" ON "SerialNumber"("tenantId", "serialNo");

-- CreateIndex
CREATE INDEX "Account_tenantId_type_idx" ON "Account"("tenantId", "type");

-- CreateIndex
CREATE INDEX "Account_tenantId_isActive_idx" ON "Account"("tenantId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Account_tenantId_code_key" ON "Account"("tenantId", "code");

-- CreateIndex
CREATE INDEX "JournalEntry_tenantId_date_idx" ON "JournalEntry"("tenantId", "date");

-- CreateIndex
CREATE INDEX "JournalEntry_tenantId_isPosted_idx" ON "JournalEntry"("tenantId", "isPosted");

-- CreateIndex
CREATE INDEX "JournalEntry_sourceId_idx" ON "JournalEntry"("sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_tenantId_entryNo_key" ON "JournalEntry"("tenantId", "entryNo");

-- CreateIndex
CREATE INDEX "JournalLine_entryId_idx" ON "JournalLine"("entryId");

-- CreateIndex
CREATE INDEX "JournalLine_accountId_idx" ON "JournalLine"("accountId");

-- CreateIndex
CREATE INDEX "BankAccount_tenantId_isActive_idx" ON "BankAccount"("tenantId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "BankAccount_tenantId_accountNumber_key" ON "BankAccount"("tenantId", "accountNumber");

-- CreateIndex
CREATE INDEX "BankStatement_tenantId_bankAccountId_idx" ON "BankStatement"("tenantId", "bankAccountId");

-- CreateIndex
CREATE INDEX "BankStatement_tenantId_date_idx" ON "BankStatement"("tenantId", "date");

-- CreateIndex
CREATE INDEX "BankStatement_isReconciled_idx" ON "BankStatement"("isReconciled");

-- CreateIndex
CREATE INDEX "TaxRate_tenantId_isActive_idx" ON "TaxRate"("tenantId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "TaxRate_tenantId_code_key" ON "TaxRate"("tenantId", "code");

-- CreateIndex
CREATE INDEX "Employee_tenantId_isActive_idx" ON "Employee"("tenantId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_tenantId_employeeNo_key" ON "Employee"("tenantId", "employeeNo");

-- CreateIndex
CREATE INDEX "Attendance_tenantId_date_idx" ON "Attendance"("tenantId", "date");

-- CreateIndex
CREATE INDEX "Attendance_employeeId_idx" ON "Attendance"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_tenantId_employeeId_date_key" ON "Attendance"("tenantId", "employeeId", "date");

-- CreateIndex
CREATE INDEX "PayrollPeriod_tenantId_status_idx" ON "PayrollPeriod"("tenantId", "status");

-- CreateIndex
CREATE INDEX "PayrollPeriod_tenantId_startDate_idx" ON "PayrollPeriod"("tenantId", "startDate");

-- CreateIndex
CREATE INDEX "PayrollEntry_tenantId_periodId_idx" ON "PayrollEntry"("tenantId", "periodId");

-- CreateIndex
CREATE INDEX "PayrollEntry_employeeId_idx" ON "PayrollEntry"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollEntry_periodId_employeeId_key" ON "PayrollEntry"("periodId", "employeeId");

-- CreateIndex
CREATE INDEX "MarketingCampaign_tenantId_status_idx" ON "MarketingCampaign"("tenantId", "status");

-- CreateIndex
CREATE INDEX "MarketingCampaign_tenantId_scheduledAt_idx" ON "MarketingCampaign"("tenantId", "scheduledAt");

-- CreateIndex
CREATE INDEX "CampaignRecipient_campaignId_status_idx" ON "CampaignRecipient"("campaignId", "status");

-- CreateIndex
CREATE INDEX "CampaignRecipient_customerId_idx" ON "CampaignRecipient"("customerId");

-- CreateIndex
CREATE INDEX "CustomerFeedback_tenantId_createdAt_idx" ON "CustomerFeedback"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "CustomerFeedback_tenantId_rating_idx" ON "CustomerFeedback"("tenantId", "rating");

-- CreateIndex
CREATE INDEX "CustomerFeedback_customerId_idx" ON "CustomerFeedback"("customerId");

-- CreateIndex
CREATE INDEX "CustomerFeedback_transactionId_idx" ON "CustomerFeedback"("transactionId");

-- CreateIndex
CREATE INDEX "WebhookEndpoint_tenantId_isActive_idx" ON "WebhookEndpoint"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "WebhookLog_tenantId_createdAt_idx" ON "WebhookLog"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "WebhookLog_endpointId_idx" ON "WebhookLog"("endpointId");

-- CreateIndex
CREATE INDEX "WebhookLog_status_idx" ON "WebhookLog"("status");

-- CreateIndex
CREATE INDEX "MarketplaceIntegration_tenantId_isActive_idx" ON "MarketplaceIntegration"("tenantId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceIntegration_tenantId_platform_key" ON "MarketplaceIntegration"("tenantId", "platform");

-- CreateIndex
CREATE INDEX "MarketplaceOrder_tenantId_platform_idx" ON "MarketplaceOrder"("tenantId", "platform");

-- CreateIndex
CREATE INDEX "MarketplaceOrder_tenantId_status_idx" ON "MarketplaceOrder"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceOrder_integrationId_externalOrderId_key" ON "MarketplaceOrder"("integrationId", "externalOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_slug_key" ON "SubscriptionPlan"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "TenantSubscription_tenantId_key" ON "TenantSubscription"("tenantId");

-- CreateIndex
CREATE INDEX "TenantSubscription_tenantId_idx" ON "TenantSubscription"("tenantId");

-- CreateIndex
CREATE INDEX "TenantSubscription_status_idx" ON "TenantSubscription"("status");

-- CreateIndex
CREATE INDEX "TenantSubscription_nextBillingDate_idx" ON "TenantSubscription"("nextBillingDate");

-- CreateIndex
CREATE UNIQUE INDEX "BillingInvoice_invoiceNo_key" ON "BillingInvoice"("invoiceNo");

-- CreateIndex
CREATE INDEX "BillingInvoice_tenantId_status_idx" ON "BillingInvoice"("tenantId", "status");

-- CreateIndex
CREATE INDEX "BillingInvoice_dueDate_idx" ON "BillingInvoice"("dueDate");

-- CreateIndex
CREATE INDEX "RolePermission_tenantId_userId_idx" ON "RolePermission"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "RolePermission_tenantId_role_idx" ON "RolePermission"("tenantId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_tenantId_role_resource_key" ON "RolePermission"("tenantId", "role", "resource");

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "PriceList"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceListItem" ADD CONSTRAINT "PriceListItem_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "PriceList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceListItem" ADD CONSTRAINT "PriceListItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ItemVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsignmentItem" ADD CONSTRAINT "ConsignmentItem_consignmentId_fkey" FOREIGN KEY ("consignmentId") REFERENCES "Consignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsignmentItem" ADD CONSTRAINT "ConsignmentItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ItemVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SerialNumber" ADD CONSTRAINT "SerialNumber_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ItemVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalLine" ADD CONSTRAINT "JournalLine_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "JournalEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalLine" ADD CONSTRAINT "JournalLine_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankStatement" ADD CONSTRAINT "BankStatement_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollEntry" ADD CONSTRAINT "PayrollEntry_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "PayrollPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollEntry" ADD CONSTRAINT "PayrollEntry_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignRecipient" ADD CONSTRAINT "CampaignRecipient_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "MarketingCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookLog" ADD CONSTRAINT "WebhookLog_endpointId_fkey" FOREIGN KEY ("endpointId") REFERENCES "WebhookEndpoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceOrder" ADD CONSTRAINT "MarketplaceOrder_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "MarketplaceIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantSubscription" ADD CONSTRAINT "TenantSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingInvoice" ADD CONSTRAINT "BillingInvoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "TenantSubscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
