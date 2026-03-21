import type {
  AdjustedCompliance,
  ApplySummary,
  ApiRoute,
  ApplyResult,
  BankEntry,
  BankResult,
  ComplianceRecord,
  PoolResult,
  RouteComparison,
} from "../../core/domain/entities";
import type { MarineApiPort } from "../../core/ports/outbound";
import { HttpClient } from "./httpClient";

function withQuery(path: string, query: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (typeof value !== "undefined") {
      params.set(key, String(value));
    }
  });

  const asString = params.toString();
  return asString ? `${path}?${asString}` : path;
}

export class MarineApiClient implements MarineApiPort {
  private readonly client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }

  fetchRoutes(): Promise<ApiRoute[]> {
    return this.client.get<ApiRoute[]>("/routes");
  }

  setBaseline(routeId: string): Promise<ApiRoute> {
    return this.client.post<ApiRoute>(`/routes/${routeId}/baseline`);
  }

  fetchComparisons(threshold: number, year?: number): Promise<RouteComparison[]> {
    return this.client.get<RouteComparison[]>(
      withQuery("/routes/comparison", {
        threshold,
        year,
      }),
    );
  }

  fetchCompliance(shipId: string, year: number): Promise<ComplianceRecord> {
    return this.client.get<ComplianceRecord>(withQuery("/compliance/cb", { shipId, year }));
  }

  fetchAdjustedCompliance(shipId: string, year: number): Promise<AdjustedCompliance> {
    return this.client.get<AdjustedCompliance>(withQuery("/compliance/adjusted-cb", { shipId, year }));
  }

  fetchBankRecords(shipId: string, year?: number): Promise<BankEntry[]> {
    return this.client.get<BankEntry[]>(withQuery("/banking/records", { shipId, year }));
  }

  fetchBankApplySummary(shipId: string, year: number): Promise<ApplySummary> {
    return this.client.get<ApplySummary>(withQuery("/banking/apply-summary", { shipId, year }));
  }

  fetchLatestBankApply(shipId: string, year: number): Promise<ApplyResult | null> {
    return this.client.get<ApplyResult | null>(withQuery("/banking/latest-apply", { shipId, year }));
  }

  bankPositiveCompliance(input: { shipId: string; year: number; amount?: number }): Promise<BankResult> {
    return this.client.post<BankResult>("/banking/bank", input);
  }

  applyBankToDeficit(input: { shipId: string; year: number; amount: number }): Promise<ApplyResult> {
    return this.client.post<ApplyResult>("/banking/apply", input);
  }

  createPool(input: { shipIds: string[]; year: number }): Promise<PoolResult> {
    return this.client.post<PoolResult>("/pools", input);
  }
}
