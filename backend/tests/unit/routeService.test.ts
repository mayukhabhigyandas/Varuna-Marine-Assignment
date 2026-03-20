import { describe, expect, it } from "vitest";
import { RouteService } from "../../src/core/application/routeService";
import { DomainError } from "../../src/core/domain/errors";
import { createMockRouteRepository, makeRoute } from "../support/repoMocks";

describe("RouteService", () => {
  it("ComputeComparison returns percentDiff and compliant flag", async () => {
    const baseline = makeRoute("route-1", 2025, 90, true);
    const challenger = makeRoute("route-2", 2025, 95, false);

    const repository = createMockRouteRepository({
      getAll: async () => [baseline, challenger],
      findBaselineByYear: async () => baseline,
    });

    const service = new RouteService(repository);
    const result = await service.compareRoutes(5, 2025);

    const route2 = result.find((item) => item.routeId === "route-2");
    expect(route2).toBeDefined();
    expect(route2?.percentDiff).toBeCloseTo(((95 - 90) / 90) * 100, 6);
    expect(route2?.compliant).toBe(false);
  });

  it("throws when no baseline exists for year", async () => {
    const repository = createMockRouteRepository({
      getAll: async () => [makeRoute("route-2", 2025, 95, false)],
      findBaselineByYear: async () => null,
    });

    const service = new RouteService(repository);

    await expect(service.compareRoutes(5, 2025)).rejects.toThrowError(DomainError);
    await expect(service.compareRoutes(5, 2025)).rejects.toThrow(
      "No baseline route found for year 2025",
    );
  });
});
