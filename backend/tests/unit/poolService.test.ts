import { describe, expect, it, vi } from "vitest";
import { BankingService } from "../../src/core/application/bankingService";
import { PoolService } from "../../src/core/application/poolService";
import { DomainError } from "../../src/core/domain/errors";
import { createMockPoolRepository } from "../support/repoMocks";

describe("PoolService", () => {
  it("CreatePool allocates surplus to deficits", async () => {
    const cbMap: Record<string, number> = {
      "ship-001": 1000,
      "ship-002": -300,
      "ship-003": -200,
    };

    const bankingService = {
      getApplySummary: vi.fn(async (shipId: string, year: number) => ({
        shipId,
        year,
        cbBefore: cbMap[shipId],
        applied: 0,
        cbAfter: cbMap[shipId],
      })),
    } as unknown as BankingService;

    const service = new PoolService(bankingService, createMockPoolRepository());

    const result = await service.createPool({
      year: 2025,
      shipIds: ["ship-001", "ship-002", "ship-003"],
    });

    expect(result.totalCbBefore).toBe(500);
    expect(result.transfers.length).toBeGreaterThan(0);
    const ship2 = result.members.find((member) => member.shipId === "ship-002");
    const ship3 = result.members.find((member) => member.shipId === "ship-003");
    expect((ship2?.cbAfter ?? -1)).toBeGreaterThanOrEqual(0);
    expect((ship3?.cbAfter ?? -1)).toBeGreaterThanOrEqual(0);
  });

  it("throws invalid pool when total CB is negative", async () => {
    const cbMap: Record<string, number> = {
      "ship-001": 100,
      "ship-002": -300,
      "ship-003": -200,
    };

    const bankingService = {
      getApplySummary: vi.fn(async (shipId: string, year: number) => ({
        shipId,
        year,
        cbBefore: cbMap[shipId],
        applied: 0,
        cbAfter: cbMap[shipId],
      })),
    } as unknown as BankingService;

    const service = new PoolService(bankingService, createMockPoolRepository());

    await expect(
      service.createPool({ year: 2025, shipIds: ["ship-001", "ship-002", "ship-003"] }),
    ).rejects.toThrowError(DomainError);
  });

  it("rejects duplicate pool for same ships in same year", async () => {
    const cbMap: Record<string, number> = {
      "ship-001": 100,
      "ship-002": 50,
    };

    const bankingService = {
      getApplySummary: vi.fn(async (shipId: string, year: number) => ({
        shipId,
        year,
        cbBefore: cbMap[shipId],
        applied: 0,
        cbAfter: cbMap[shipId],
      })),
    } as unknown as BankingService;

    const service = new PoolService(
      bankingService,
      createMockPoolRepository({
        listByYear: async () => [
          {
            id: "pool-existing",
            year: 2025,
            shipIds: ["ship-002", "ship-001"],
            createdAt: new Date().toISOString(),
          },
        ],
      }),
    );

    await expect(
      service.createPool({ year: 2025, shipIds: ["ship-001", "ship-002"] }),
    ).rejects.toThrowError(DomainError);
  });
});
