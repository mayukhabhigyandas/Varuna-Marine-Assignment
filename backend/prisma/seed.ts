import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const routeShipSeedData = [
  {
    shipId: "SHIP_R001",
    routeId: "R001",
    vesselType: "Container",
    fuelType: "HFO",
    year: 2024,
    ghgIntensity: 91.0,
    fuelConsumptionTonnes: 5000,
    distanceKm: 12000,
    totalEmissionsTonnes: 4500,
  },
  {
    shipId: "SHIP_R002",
    routeId: "R002",
    vesselType: "BulkCarrier",
    fuelType: "LNG",
    year: 2024,
    ghgIntensity: 88.0,
    fuelConsumptionTonnes: 4800,
    distanceKm: 11500,
    totalEmissionsTonnes: 4200,
  },
  {
    shipId: "SHIP_R003",
    routeId: "R003",
    vesselType: "Tanker",
    fuelType: "MGO",
    year: 2024,
    ghgIntensity: 93.5,
    fuelConsumptionTonnes: 5100,
    distanceKm: 12500,
    totalEmissionsTonnes: 4700,
  },
  {
    shipId: "SHIP_R004",
    routeId: "R004",
    vesselType: "RoRo",
    fuelType: "HFO",
    year: 2025,
    ghgIntensity: 89.2,
    fuelConsumptionTonnes: 4900,
    distanceKm: 11800,
    totalEmissionsTonnes: 4300,
  },
  {
    shipId: "SHIP_R005",
    routeId: "R005",
    vesselType: "Container",
    fuelType: "LNG",
    year: 2025,
    ghgIntensity: 90.5,
    fuelConsumptionTonnes: 4950,
    distanceKm: 11900,
    totalEmissionsTonnes: 4400,
  },
];

async function main() {
  await prisma.poolMember.deleteMany();
  await prisma.pool.deleteMany();
  await prisma.bankEntry.deleteMany();
  await prisma.complianceRecord.deleteMany();
  await prisma.shipEmission.deleteMany();
  await prisma.route.deleteMany();

  await prisma.route.createMany({
    data: routeShipSeedData.map((item) => ({
      id: item.routeId,
      name: item.routeId,
      year: item.year,
      intensity: item.ghgIntensity,
      isBaseline: item.routeId === "R001",
    })),
  });

  await prisma.shipEmission.createMany({
    data: routeShipSeedData.map((item) => ({
      shipId: item.shipId,
      routeId: item.routeId,
      year: item.year,
      vesselType: item.vesselType,
      fuelType: item.fuelType,
      fuelConsumptionTons: item.fuelConsumptionTonnes,
      distanceKm: item.distanceKm,
      totalEmissionsTonnes: item.totalEmissionsTonnes,
      actualIntensity: item.ghgIntensity,
    })),
  });

  await prisma.bankEntry.create({
    data: {
      id: "bank-seed-1",
      shipId: "SHIP_R002",
      year: 2024,
      amount: 1500000,
      usedAmount: 0,
      sourceComplianceYear: 2024,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
