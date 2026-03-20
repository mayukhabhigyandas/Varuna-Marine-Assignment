import { readFile } from "fs/promises";
import { describe, expect, it } from "vitest";

describe("Data Assets", () => {
  it("Migrations are present and SQL defines required tables", async () => {
    const migrationPath = "prisma/migrations/20260319_init/migration.sql";
    const migrationBuffer = await readFile(migrationPath);

    const firstThree = [...migrationBuffer.subarray(0, 3)];
    expect(firstThree).not.toEqual([0xef, 0xbb, 0xbf]);

    const sql = migrationBuffer.toString("utf8");
    expect(sql).toContain('CREATE TABLE "Route"');
    expect(sql).toContain('CREATE TABLE "ShipEmission"');
    expect(sql).toContain('CREATE TABLE "ComplianceRecord"');
    expect(sql).toContain('CREATE TABLE "BankEntry"');
    expect(sql).toContain('CREATE TABLE "Pool"');
    expect(sql).toContain('CREATE TABLE "PoolMember"');
  });

  it("Seed script inserts baseline test data", async () => {
    const seedPath = "prisma/seed.ts";
    const seed = await readFile(seedPath, "utf8");

    expect(seed).toContain("prisma.route.createMany");
    expect(seed).toContain("prisma.shipEmission.createMany");
    expect(seed).toContain("prisma.bankEntry.create");
    expect(seed).toContain('routeId: "R001"');
    expect(seed).toContain('shipId: "SHIP_R001"');
  });
});
