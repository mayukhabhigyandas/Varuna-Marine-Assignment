import { DomainError } from "../domain/errors";
import { RouteComparison } from "../domain/models";
import { RouteRepository } from "../ports/repositories";

export class RouteService {
  constructor(private readonly routeRepository: RouteRepository) {}

  async getAllRoutes() {
    return this.routeRepository.getAll();
  }

  async markBaseline(routeId: string) {
    const route = await this.routeRepository.findById(routeId);
    if (!route) {
      throw new DomainError(`Route ${routeId} not found`, 404);
    }

    return this.routeRepository.setBaseline(routeId);
  }

  async compareRoutes(threshold = 0, year?: number): Promise<RouteComparison[]> {
    const routes = await this.routeRepository.getAll();
    const filtered = typeof year === "number" ? routes.filter((route) => route.year === year) : routes;

    if (filtered.length === 0) {
      return [];
    }

    const result: RouteComparison[] = [];

    const groupedByYear = new Map<number, typeof filtered>();
    for (const route of filtered) {
      const group = groupedByYear.get(route.year) ?? [];
      group.push(route);
      groupedByYear.set(route.year, group);
    }

    for (const [groupYear, groupRoutes] of groupedByYear.entries()) {
      const baseline = await this.routeRepository.findBaselineByYear(groupYear);
      if (!baseline) {
        throw new DomainError(`No baseline route found for year ${groupYear}`, 400);
      }

      for (const route of groupRoutes) {
        const percentDiff = ((route.intensity - baseline.intensity) / baseline.intensity) * 100;
        result.push({
          routeId: route.id,
          routeName: route.name,
          year: route.year,
          baselineRouteId: baseline.id,
          baselineIntensity: baseline.intensity,
          routeIntensity: route.intensity,
          percentDiff,
          compliant: percentDiff <= threshold,
        });
      }
    }

    return result;
  }
}
