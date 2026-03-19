import { calculateComplianceBalance, calculateEnergyInScopeMj } from "../domain/compliance";
import { TARGET_INTENSITY_2025 } from "../domain/constants";
import { DomainError } from "../domain/errors";
import { AdjustedComplianceResult, ComplianceRecord } from "../domain/models";
import {
  BankRepository,
  ComplianceRepository,
  ShipEmissionRepository,
} from "../ports/repositories";

export class ComplianceService {
  constructor(
    private readonly shipEmissionRepository: ShipEmissionRepository,
    private readonly complianceRepository: ComplianceRepository,
    private readonly bankRepository: BankRepository,
  ) {}

  async computeComplianceBalance(shipId: string, year: number): Promise<ComplianceRecord> {
    const emission = await this.shipEmissionRepository.findByShipIdAndYear(shipId, year);
    if (!emission) {
      throw new DomainError(`No emission data found for ship ${shipId} in ${year}`, 404);
    }

    const energyInScopeMj = calculateEnergyInScopeMj(emission.fuelConsumptionTons);
    const complianceBalance = calculateComplianceBalance(
      TARGET_INTENSITY_2025,
      emission.actualIntensity,
      energyInScopeMj,
    );

    return this.complianceRepository.save({
      shipId,
      year,
      targetIntensity: TARGET_INTENSITY_2025,
      actualIntensity: emission.actualIntensity,
      energyInScopeMj,
      complianceBalance,
      createdAt: new Date().toISOString(),
    });
  }

  async getOrComputeComplianceBalance(shipId: string, year: number): Promise<ComplianceRecord> {
    const existing = await this.complianceRepository.findByShipIdAndYear(shipId, year);
    if (existing) {
      return existing;
    }

    return this.computeComplianceBalance(shipId, year);
  }

  async getAdjustedComplianceBalance(shipId: string, year: number): Promise<AdjustedComplianceResult> {
    const cbRecord = await this.getOrComputeComplianceBalance(shipId, year);

    if (cbRecord.complianceBalance >= 0) {
      return {
        shipId,
        year,
        rawComplianceBalance: cbRecord.complianceBalance,
        adjustedComplianceBalance: cbRecord.complianceBalance,
        appliedFromBank: 0,
        availableBankBeforeApply: 0,
      };
    }

    const availableEntries = await this.bankRepository.listByShipUpToYear(shipId, year);
    const availableBank = availableEntries.reduce(
      (sum, entry) => sum + (entry.amount - entry.usedAmount),
      0,
    );

    const required = Math.abs(cbRecord.complianceBalance);
    const applied = Math.min(required, availableBank);

    return {
      shipId,
      year,
      rawComplianceBalance: cbRecord.complianceBalance,
      adjustedComplianceBalance: cbRecord.complianceBalance + applied,
      appliedFromBank: applied,
      availableBankBeforeApply: availableBank,
    };
  }
}
