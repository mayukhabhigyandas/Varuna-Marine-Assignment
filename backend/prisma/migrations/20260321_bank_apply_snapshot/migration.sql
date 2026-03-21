-- Persist latest banking apply values for UI recovery and auditing
CREATE TABLE "BankApplySnapshot" (
  "id" TEXT NOT NULL,
  "shipId" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "cbBefore" DOUBLE PRECISION NOT NULL,
  "applied" DOUBLE PRECISION NOT NULL,
  "cbAfter" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "BankApplySnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BankApplySnapshot_shipId_year_createdAt_idx"
ON "BankApplySnapshot"("shipId", "year", "createdAt");
