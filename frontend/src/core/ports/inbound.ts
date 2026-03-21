import type {
  AdjustedCompliance,
  ApplySummary,
  ApplyResult,
  BankEntry,
  BankResult,
  ComparisonViewModel,
  ComplianceRecord,
  PoolResult,
  RouteViewModel,
} from "../domain/entities";

export interface RoutesTabInputPort {
  getRoutes(): Promise<RouteViewModel[]>;
  setBaseline(routeId: string): Promise<RouteViewModel[]>;
}

export interface CompareTabInputPort {
  getComparisons(year?: number): Promise<ComparisonViewModel[]>;
}

export interface BankingTabInputPort {
  getCompliance(shipId: string, year: number): Promise<ComplianceRecord>;
  getBankRecords(shipId: string, year?: number): Promise<BankEntry[]>;
  getBankApplySummary(shipId: string, year: number): Promise<ApplySummary>;
  getLatestBankApply(shipId: string, year: number): Promise<ApplyResult | null>;
  bankPositive(input: { shipId: string; year: number; amount?: number }): Promise<BankResult>;
  applyBank(input: { shipId: string; year: number; amount: number }): Promise<ApplyResult>;
}

export interface PoolingTabInputPort {
  getAdjustedCompliance(shipId: string, year: number): Promise<AdjustedCompliance>;
  getBankApplySummary(shipId: string, year: number): Promise<ApplySummary>;
  createPool(input: { shipIds: string[]; year: number }): Promise<PoolResult>;
}
