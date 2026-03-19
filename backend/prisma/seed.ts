import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.poolMember.deleteMany();
  await prisma.pool.deleteMany();
  await prisma.bankEntry.deleteMany();
  await prisma.complianceRecord.deleteMany();
  await prisma.shipEmission.deleteMany();
  await prisma.route.deleteMany();

  await prisma.route.createMany({
    data: [
      { id: "route-1", name: "Arabian Corridor", year: 2025, intensity: 87.5, isBaseline: true },
      { id: "route-2", name: "Pacific Loop", year: 2025, intensity: 91.2, isBaseline: false },
      { id: "route-3", name: "Atlantic Link", year: 2025, intensity: 89.7, isBaseline: false },
      { id: "route-4", name: "Legacy Route", year: 2024, intensity: 92.1, isBaseline: true },
    ],
  });

  await prisma.shipEmission.createMany({
    data: [
      { shipId: "ship-001", year: 2025, fuelConsumptionTons: 110, actualIntensity: 84.2 },
      { shipId: "ship-002", year: 2025, fuelConsumptionTons: 95, actualIntensity: 97.1 },
      { shipId: "ship-003", year: 2025, fuelConsumptionTons: 120, actualIntensity: 80.0 },
      { shipId: "ship-002", year: 2024, fuelConsumptionTons: 96, actualIntensity: 78.4 },
    ],
  });

  await prisma.bankEntry.create({
    data: {
      id: "bank-seed-1",
      shipId: "ship-002",
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
