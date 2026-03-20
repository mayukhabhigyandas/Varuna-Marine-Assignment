import { describe, expect, it } from "vitest";
import { ComplianceService } from "../../src/core/application/complianceService";
import { DomainError } from "../../src/core/domain/errors";
import { TARGET_INTENSITY_2025 } from "../../src/core/domain/constants";
import {
  createMockBankRepository,
  createMockComplianceRepository,
  createMockShipEmissionRepository,
  makeEmission,
} from "../support/repoMocks";

describe("ComplianceService", () => {
  it("ComputeCB computes and persists compliance balance", async () => {
    const shipEmissionRepository = createMockShipEmissionRepository({
      findByShipIdAndYear: async () => makeEmission("ship-001", 2025, 80),
    });

    let savedCb = 0;
    const complianceRepository = createMockComplianceRepository({
      save: async (record) => {
        savedCb = record.complianceBalance;
        return record;
      },
    });

    const service = new ComplianceService(
      shipEmissionRepository,
      complianceRepository,
      createMockBankRepository(),
    );

    const result = await service.computeComplianceBalance("ship-001", 2025);
    const expected = (TARGET_INTENSITY_2025 - 80) * (100 * 41000);

    expect(result.complianceBalance).toBeCloseTo(expected, 6);
    expect(savedCb).toBeCloseTo(expected, 6);
  });

  it("throws when no emission data exists", async () => {
    const service = new ComplianceService(
      createMockShipEmissionRepository({
        findByShipIdAndYear: async () => null,
      }),
      createMockComplianceRepository(),
      createMockBankRepository(),
    );

    await expect(service.computeComplianceBalance("ship-009", 2030)).rejects.toThrowError(
      DomainError,
    );
    await expect(service.computeComplianceBalance("ship-009", 2030)).rejects.toThrow(
      "No emission data found for ship ship-009 in 2030",
    );
  });
});
