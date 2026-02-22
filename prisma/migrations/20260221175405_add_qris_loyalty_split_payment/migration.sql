-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'POINTS';

-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "loyaltyEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "loyaltyPointValue" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "loyaltyPointsPerRupiah" INTEGER NOT NULL DEFAULT 1000,
ADD COLUMN     "qrisString" TEXT;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "pointsEarned" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pointsRedeemed" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "TransactionPayment" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransactionPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TransactionPayment_transactionId_idx" ON "TransactionPayment"("transactionId");

-- AddForeignKey
ALTER TABLE "TransactionPayment" ADD CONSTRAINT "TransactionPayment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
