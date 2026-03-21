import { TARGET_GHG_INTENSITY } from "../domain/constants";
import type {
  ApplySummary,
  ComparisonViewModel,
  RouteViewModel,
} from "../domain/entities";
import { ROUTE_CATALOG } from "../domain/routeCatalog";
import type {
  BankingTabInputPort,
  CompareTabInputPort,
  PoolingTabInputPort,
  RoutesTabInputPort,
} from "../ports/inbound";
import type { MarineApiPort } from "../ports/outbound";

const routeCatalogByRouteId = new Map(ROUTE_CATALOG.map((entry) => [entry.routeId, entry]));
const catalogYears = Array.from(new Set(ROUTE_CATALOG.map((entry) => entry.year))).sort((a, b) => a - b);

export class MarineDashboardService
  implements RoutesTabInputPort, CompareTabInputPort, BankingTabInputPort, PoolingTabInputPort
{
  private readonly api: MarineApiPort;

  constructor(api: MarineApiPort) {
    this.api = api;
  }

  async getRoutes(): Promise<RouteViewModel[]> {
    const routes = await this.api.fetchRoutes();

    return routes.map((route) => {
      const routeId = route.routeId ?? route.id;
      const catalog = routeCatalogByRouteId.get(routeId);

      return {
        routeId,
        shipId: route.shipId ?? catalog?.shipId ?? `SHIP_${routeId}`,
        vesselType: route.vesselType ?? catalog?.vesselType ?? "Unknown",
        fuelType: route.fuelType ?? catalog?.fuelType ?? "Unknown",
        year: route.year,
        ghgIntensity: route.intensity,
        fuelConsumptionTonnes: route.fuelConsumptionTons ?? catalog?.fuelConsumptionTonnes ?? 0,
        distanceKm: route.distanceKm ?? catalog?.distanceKm ?? 0,
        totalEmissionsTonnes: route.totalEmissionsTonnes ?? catalog?.totalEmissionsTonnes ?? 0,
        isBaseline: route.isBaseline,
      };
    });
  }

  async setBaseline(routeId: string): Promise<RouteViewModel[]> {
    await this.api.setBaseline(routeId);
    return this.getRoutes();
  }

  async getComparisons(year?: number): Promise<ComparisonViewModel[]> {
    const comparisons = typeof year === "number"
      ? await this.api.fetchComparisons(0, year)
      : await this.fetchAvailableComparisonsAcrossYears();

    return comparisons.map((item) => {
      const ghgIntensity = item.routeIntensity;
      const percentDiff = ((ghgIntensity / item.baselineIntensity) - 1) * 100;

      return {
        routeId: item.routeId,
        routeName: item.routeName,
        year: item.year,
        baselineRouteId: item.baselineRouteId,
        baselineIntensity: item.baselineIntensity,
        ghgIntensity,
        percentDiff,
        compliant: ghgIntensity <= TARGET_GHG_INTENSITY,
      };
    });
  }

  private async fetchAvailableComparisonsAcrossYears() {
    const settled = await Promise.allSettled(
      catalogYears.map((catalogYear) => this.api.fetchComparisons(0, catalogYear)),
    );

    const successful = settled
      .filter((result): result is PromiseFulfilledResult<Awaited<ReturnType<MarineApiPort["fetchComparisons"]>>> => result.status === "fulfilled")
      .flatMap((result) => result.value);

    if (successful.length > 0) {
      return successful;
    }

    const firstError = settled.find((result): result is PromiseRejectedResult => result.status === "rejected");
    throw firstError?.reason ?? new Error("No comparison data available for any year");
  }

  getCompliance(shipId: string, year: number) {
    return this.api.fetchCompliance(shipId, year);
  }

  getBankRecords(shipId: string, year?: number) {
    return this.api.fetchBankRecords(shipId, year);
  }

  getLatestBankApply(shipId: string, year: number) {
    return this.api.fetchLatestBankApply(shipId, year);
  }

  bankPositive(input: { shipId: string; year: number; amount?: number }) {
    return this.api.bankPositiveCompliance(input);
  }

  applyBank(input: { shipId: string; year: number; amount: number }) {
    return this.api.applyBankToDeficit(input);
  }

  getAdjustedCompliance(shipId: string, year: number) {
    return this.api.fetchAdjustedCompliance(shipId, year);
  }

  createPool(input: { shipIds: string[]; year: number }) {
    return this.api.createPool(input);
  }

  getBankApplySummary(shipId: string, year: number): Promise<ApplySummary> {
    return this.api.fetchBankApplySummary(shipId, year);
  }
}
