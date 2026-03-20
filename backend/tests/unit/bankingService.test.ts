import { describe, expect, it, vi } from "vitest";
import { BankingService } from "../../src/core/application/bankingService";
import { ComplianceService } from "../../src/core/application/complianceService";
import { DomainError } from "../../src/core/domain/errors";
import { createMockBankRepository } from "../support/repoMocks";

describe("BankingService", () => {
  it("BankSurplus banks positive CB", async () => {
    const complianceService = {
      getOrComputeComplianceBalance: vi.fn(async () => ({
        shipId: "ship-001",
        year: 2025,
        targetIntensity: 89.3368,
        actualIntensity: 80,
        energyInScopeMj: 4100000,
        complianceBalance: 1000,
        createdAt: new Date().toISOString(),
      })),
    } as unknown as ComplianceService;

    const bankRepository = createMockBankRepository({
      sumBankedFromComplianceYear: async () => 200,
    });

    const service = new BankingService(complianceService, bankRepository);
    const result = await service.bankPositiveCompliance({
      shipId: "ship-001",
      year: 2025,
      amount: 500,
    });

    expect(result.entry.amount).toBe(500);
    expect(result.remainingBankable).toBe(300);
  });

  it("rejects banking when compliance balance is negative", async () => {
    const complianceService = {
      getOrComputeComplianceBalance: vi.fn(async () => ({
        shipId: "ship-002",
        year: 2025,
        targetIntensity: 89.3368,
        actualIntensity: 95,
        energyInScopeMj: 4100000,
        complianceBalance: -300,
        createdAt: new Date().toISOString(),
      })),
    } as unknown as ComplianceService;

    const service = new BankingService(complianceService, createMockBankRepository());

    await expect(
      service.bankPositiveCompliance({ shipId: "ship-002", year: 2025 }),
    ).rejects.toThrowError(DomainError);
  });

  it("ApplyBanked rejects over-applying beyond available bank", async () => {
    const complianceService = {
      getOrComputeComplianceBalance: vi.fn(async () => ({
        shipId: "ship-002",
        year: 2025,
        targetIntensity: 89.3368,
        actualIntensity: 96,
        energyInScopeMj: 4100000,
        complianceBalance: -500,
        createdAt: new Date().toISOString(),
      })),
    } as unknown as ComplianceService;

    const bankRepository = createMockBankRepository({
      listByShipUpToYear: async () => [
        {
          id: "entry-1",
          shipId: "ship-002",
          year: 2024,
          amount: 100,
          usedAmount: 0,
          sourceComplianceYear: 2024,
          createdAt: new Date().toISOString(),
        },
      ],
    });

    const service = new BankingService(complianceService, bankRepository);

    await expect(
      service.applyBankToDeficit({ shipId: "ship-002", year: 2025, amount: 120 }),
    ).rejects.toThrow("Requested amount exceeds available banked surplus");
  });

  it("ApplyBanked updates adjusted balance for valid request", async () => {
    const complianceService = {
      getOrComputeComplianceBalance: vi.fn(async () => ({
        shipId: "ship-002",
        year: 2025,
        targetIntensity: 89.3368,
        actualIntensity: 96,
        energyInScopeMj: 4100000,
        complianceBalance: -500,
        createdAt: new Date().toISOString(),
      })),
    } as unknown as ComplianceService;

    const bankRepository = createMockBankRepository({
      listByShipUpToYear: async () => [
        {
          id: "entry-1",
          shipId: "ship-002",
          year: 2024,
          amount: 300,
          usedAmount: 0,
          sourceComplianceYear: 2024,
          createdAt: new Date().toISOString(),
        },
      ],
      applyAmount: async () => [{ entryId: "entry-1", appliedAmount: 200 }],
    });

    const service = new BankingService(complianceService, bankRepository);
    const result = await service.applyBankToDeficit({ shipId: "ship-002", year: 2025, amount: 200 });

    expect(result.adjustedComplianceBalance).toBe(-300);
    expect(result.applications).toEqual([{ entryId: "entry-1", appliedAmount: 200 }]);
  });
});
