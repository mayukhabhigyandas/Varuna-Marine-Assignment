import type {
  AdjustedCompliance,
  ApiRoute,
  ApplyResult,
  BankEntry,
  BankResult,
  ComplianceRecord,
  PoolResult,
  RouteComparison,
} from "../domain/entities";

export interface MarineApiPort {
  fetchRoutes(): Promise<ApiRoute[]>;
  setBaseline(routeId: string): Promise<ApiRoute>;
  fetchComparisons(threshold: number, year?: number): Promise<RouteComparison[]>;
  fetchCompliance(shipId: string, year: number): Promise<ComplianceRecord>;
  fetchAdjustedCompliance(shipId: string, year: number): Promise<AdjustedCompliance>;
  fetchBankRecords(shipId: string, year?: number): Promise<BankEntry[]>;
  bankPositiveCompliance(input: { shipId: string; year: number; amount?: number }): Promise<BankResult>;
  applyBankToDeficit(input: { shipId: string; year: number; amount: number }): Promise<ApplyResult>;
  createPool(input: { shipIds: string[]; year: number }): Promise<PoolResult>;
}
