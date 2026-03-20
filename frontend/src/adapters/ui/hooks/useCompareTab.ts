import { useCallback, useEffect, useMemo, useState } from "react";
import { TARGET_GHG_INTENSITY } from "../../../core/domain/constants";
import type { ComparisonViewModel } from "../../../core/domain/entities";
import type { CompareTabInputPort } from "../../../core/ports/inbound";
import { uniqueValues } from "../../../shared/format";

export function useCompareTab(service: CompareTabInputPort) {
  const [comparisons, setComparisons] = useState<ComparisonViewModel[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadComparisons = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const year = selectedYear === "all" ? undefined : Number(selectedYear);
      const data = await service.getComparisons(year);
      setComparisons(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load comparison data");
    } finally {
      setLoading(false);
    }
  }, [selectedYear, service]);

  useEffect(() => {
    void loadComparisons();
  }, [loadComparisons]);

  const yearOptions = useMemo(
    () => uniqueValues(comparisons.map((row) => row.year)).sort((a, b) => a - b),
    [comparisons],
  );

  const chartData = useMemo(
    () => comparisons.map((row) => ({
      route: row.routeId,
      baseline: row.baselineIntensity,
      ghg: row.ghgIntensity,
      target: TARGET_GHG_INTENSITY,
    })),
    [comparisons],
  );

  return {
    loading,
    error,
    selectedYear,
    setSelectedYear,
    comparisons,
    yearOptions,
    chartData,
    target: TARGET_GHG_INTENSITY,
    refresh: loadComparisons,
  };
}
