import { DomainError } from "../domain/errors";
import { BankEntry } from "../domain/models";
import { BankRepository } from "../ports/repositories";
import { ComplianceService } from "./complianceService";

interface BankPositiveInput {
  shipId: string;
  year: number;
  amount?: number;
}

interface ApplyBankInput {
  shipId: string;
  year: number;
  amount: number;
}

export class BankingService {
  constructor(
    private readonly complianceService: ComplianceService,
    private readonly bankRepository: BankRepository,
  ) {}

  async getRecords(shipId: string, year?: number): Promise<BankEntry[]> {
    return this.bankRepository.listByShip(shipId, year);
  }

  async bankPositiveCompliance(input: BankPositiveInput) {
    const cbRecord = await this.complianceService.getOrComputeComplianceBalance(input.shipId, input.year);

    if (cbRecord.complianceBalance <= 0) {
      throw new DomainError("Only positive compliance balance can be banked", 400);
    }

    const alreadyBanked = await this.bankRepository.sumBankedFromComplianceYear(
      input.shipId,
      input.year,
    );

    const remainingBankable = cbRecord.complianceBalance - alreadyBanked;
    if (remainingBankable <= 0) {
      throw new DomainError("No bankable surplus remaining for this year", 400);
    }

    const amountToBank = input.amount ?? remainingBankable;

    if (amountToBank <= 0) {
      throw new DomainError("Bank amount must be positive", 400);
    }

    if (amountToBank > remainingBankable) {
      throw new DomainError(
        `Cannot bank more than remaining surplus (${remainingBankable.toFixed(2)})`,
        400,
      );
    }

    const entry = await this.bankRepository.create({
      shipId: input.shipId,
      year: input.year,
      amount: amountToBank,
      usedAmount: 0,
      sourceComplianceYear: input.year,
    });

    return {
      entry,
      remainingBankable: remainingBankable - amountToBank,
    };
  }

  async applyBankToDeficit(input: ApplyBankInput) {
    if (input.amount <= 0) {
      throw new DomainError("Apply amount must be positive", 400);
    }

    const cbRecord = await this.complianceService.getOrComputeComplianceBalance(input.shipId, input.year);

    if (cbRecord.complianceBalance >= 0) {
      throw new DomainError("Bank can only be applied to deficit compliance balances", 400);
    }

    const deficit = Math.abs(cbRecord.complianceBalance);
    const entries = await this.bankRepository.listByShipUpToYear(input.shipId, input.year);
    const available = entries.reduce((sum, entry) => sum + (entry.amount - entry.usedAmount), 0);

    if (input.amount > available) {
      throw new DomainError("Requested amount exceeds available banked surplus", 400);
    }

    if (input.amount > deficit) {
      throw new DomainError("Cannot apply more than the current deficit", 400);
    }

    const applications = await this.bankRepository.applyAmount(input.shipId, input.year, input.amount);

    return {
      shipId: input.shipId,
      year: input.year,
      originalDeficit: cbRecord.complianceBalance,
      appliedAmount: input.amount,
      adjustedComplianceBalance: cbRecord.complianceBalance + input.amount,
      applications,
    };
  }
}
