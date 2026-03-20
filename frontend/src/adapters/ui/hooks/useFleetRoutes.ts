import { useCallback, useEffect, useMemo, useState } from "react";
import type { RouteViewModel } from "../../../core/domain/entities";
import type { RoutesTabInputPort } from "../../../core/ports/inbound";
import { uniqueValues } from "../../../shared/format";

export function useFleetRoutes(service: RoutesTabInputPort) {
  const [routes, setRoutes] = useState<RouteViewModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await service.getRoutes();
      setRoutes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load fleet routes");
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const shipOptions = useMemo(
    () => uniqueValues(routes.map((route) => route.shipId)).sort(),
    [routes],
  );

  const yearOptions = useMemo(
    () => uniqueValues(routes.map((route) => route.year)).sort((a, b) => a - b),
    [routes],
  );

  return {
    routes,
    shipOptions,
    yearOptions,
    loading,
    error,
    refresh,
  };
}
