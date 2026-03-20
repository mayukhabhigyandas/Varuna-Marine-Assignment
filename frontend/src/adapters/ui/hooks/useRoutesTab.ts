import { useCallback, useEffect, useMemo, useState } from "react";
import type { RouteViewModel } from "../../../core/domain/entities";
import type { RoutesTabInputPort } from "../../../core/ports/inbound";
import { uniqueValues } from "../../../shared/format";

interface RouteFilters {
  vesselType: string;
  fuelType: string;
  year: string;
}

const DEFAULT_FILTERS: RouteFilters = {
  vesselType: "all",
  fuelType: "all",
  year: "all",
};

export function useRoutesTab(service: RoutesTabInputPort) {
  const [routes, setRoutes] = useState<RouteViewModel[]>([]);
  const [filters, setFilters] = useState<RouteFilters>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [baselineUpdatingId, setBaselineUpdatingId] = useState<string | null>(null);

  const loadRoutes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await service.getRoutes();
      setRoutes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load routes");
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    void loadRoutes();
  }, [loadRoutes]);

  const filteredRoutes = useMemo(() => {
    return routes.filter((route) => {
      if (filters.vesselType !== "all" && route.vesselType !== filters.vesselType) {
        return false;
      }

      if (filters.fuelType !== "all" && route.fuelType !== filters.fuelType) {
        return false;
      }

      if (filters.year !== "all" && route.year !== Number(filters.year)) {
        return false;
      }

      return true;
    });
  }, [filters, routes]);

  const vesselTypeOptions = useMemo(
    () => uniqueValues(routes.map((route) => route.vesselType)).sort(),
    [routes],
  );

  const fuelTypeOptions = useMemo(
    () => uniqueValues(routes.map((route) => route.fuelType)).sort(),
    [routes],
  );

  const yearOptions = useMemo(
    () => uniqueValues(routes.map((route) => route.year)).sort((a, b) => a - b),
    [routes],
  );

  const updateFilter = useCallback((key: keyof RouteFilters, value: string) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  }, []);

  const setBaseline = useCallback(
    async (routeId: string) => {
      setBaselineUpdatingId(routeId);
      setError(null);

      try {
        const updated = await service.setBaseline(routeId);
        setRoutes(updated);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to set baseline");
      } finally {
        setBaselineUpdatingId(null);
      }
    },
    [service],
  );

  return {
    loading,
    error,
    routes: filteredRoutes,
    filters,
    vesselTypeOptions,
    fuelTypeOptions,
    yearOptions,
    baselineUpdatingId,
    setBaseline,
    updateFilter,
    refresh: loadRoutes,
  };
}
