CREATE TABLE IF NOT EXISTS "ProductionTarget" (
    "id" TEXT NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "targetQuantity" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionTarget_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProductionTarget_month_key" ON "ProductionTarget"("month");
CREATE INDEX IF NOT EXISTS "ProductionTarget_month_idx" ON "ProductionTarget"("month");
