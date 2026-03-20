-- Recreate ShipEmission with route linkage and detailed ship attributes.
-- This intentionally removes old ShipEmission structure and data.
DROP TABLE "ShipEmission";

CREATE TABLE "ShipEmission" (
    "shipId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "vesselType" TEXT NOT NULL,
    "fuelType" TEXT NOT NULL,
    "fuelConsumptionTons" DOUBLE PRECISION NOT NULL,
    "distanceKm" DOUBLE PRECISION NOT NULL,
    "totalEmissionsTonnes" DOUBLE PRECISION NOT NULL,
    "actualIntensity" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ShipEmission_pkey" PRIMARY KEY ("shipId","year")
);

CREATE UNIQUE INDEX "ShipEmission_routeId_key" ON "ShipEmission"("routeId");
CREATE INDEX "ShipEmission_year_idx" ON "ShipEmission"("year");

ALTER TABLE "ShipEmission"
ADD CONSTRAINT "ShipEmission_routeId_fkey"
FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
