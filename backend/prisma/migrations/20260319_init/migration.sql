-- CreateTable
CREATE TABLE "Route" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "intensity" DOUBLE PRECISION NOT NULL,
    "isBaseline" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShipEmission" (
    "shipId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "fuelConsumptionTons" DOUBLE PRECISION NOT NULL,
    "actualIntensity" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ShipEmission_pkey" PRIMARY KEY ("shipId","year")
);

-- CreateTable
CREATE TABLE "ComplianceRecord" (
    "shipId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "targetIntensity" DOUBLE PRECISION NOT NULL,
    "actualIntensity" DOUBLE PRECISION NOT NULL,
    "energyInScopeMj" DOUBLE PRECISION NOT NULL,
    "complianceBalance" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplianceRecord_pkey" PRIMARY KEY ("shipId","year")
);

-- CreateTable
CREATE TABLE "BankEntry" (
    "id" TEXT NOT NULL,
    "shipId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "usedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sourceComplianceYear" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pool" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "shipIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoolMember" (
    "poolId" TEXT NOT NULL,
    "shipId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "cbBefore" DOUBLE PRECISION NOT NULL,
    "cbAfter" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PoolMember_pkey" PRIMARY KEY ("poolId","shipId")
);

-- CreateIndex
CREATE INDEX "Route_year_idx" ON "Route"("year");

-- CreateIndex
CREATE INDEX "Route_year_isBaseline_idx" ON "Route"("year", "isBaseline");

-- CreateIndex
CREATE INDEX "BankEntry_shipId_year_idx" ON "BankEntry"("shipId", "year");

-- CreateIndex
CREATE INDEX "PoolMember_shipId_year_idx" ON "PoolMember"("shipId", "year");

-- AddForeignKey
ALTER TABLE "PoolMember" ADD CONSTRAINT "PoolMember_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "Pool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

