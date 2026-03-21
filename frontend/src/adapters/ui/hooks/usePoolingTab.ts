import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdjustedCompliance, PoolResult } from "../../../core/domain/entities";
import type { PoolingTabInputPort } from "../../../core/ports/inbound";

export function usePoolingTab(service: PoolingTabInputPort, shipOptions: string[], yearOptions: number[]) {
  const [selectedShips, setSelectedShips] = useState<string[]>([]);
  const [year, setYear] = useState<number>(yearOptions[0] ?? new Date().getFullYear());
  const [adjustedByShip, setAdjustedByShip] = useState<Record<string, AdjustedCompliance>>({});
  const [poolResult, setPoolResult] = useState<PoolResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedShips.length === 0 && shipOptions.length > 0) {
      setSelectedShips(shipOptions.slice(0, Math.min(shipOptions.length, 2)));
    }
  }, [selectedShips.length, shipOptions]);

  useEffect(() => {
    if (!yearOptions.includes(year) && yearOptions.length > 0) {
      setYear(yearOptions[0]);
    }
  }, [year, yearOptions]);

  const refreshAdjustedBalances = useCallback(async () => {
    if (selectedShips.length === 0) {
      setAdjustedByShip({});
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const entries = await Promise.all(
        selectedShips.map(async (shipId) => {
          const summary = await service.getBankApplySummary(shipId, year);
          return [
            shipId,
            {
              shipId,
              year,
              rawComplianceBalance: summary.cbBefore,
              adjustedComplianceBalance: summary.cbAfter,
              appliedFromBank: summary.applied,
              availableBankBeforeApply: 0,
            },
          ] as const;
        }),
      );

      setAdjustedByShip(Object.fromEntries(entries));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load adjusted CB");
    } finally {
      setLoading(false);
    }
  }, [selectedShips, service, year]);

  useEffect(() => {
    void refreshAdjustedBalances();
  }, [refreshAdjustedBalances]);

  const toggleShip = useCallback((shipId: string) => {
    setSelectedShips((current) => {
      if (current.includes(shipId)) {
        return current.filter((id) => id !== shipId);
      }

      return [...current, shipId];
    });
  }, []);

  const adjustedRows = useMemo(
    () => selectedShips
      .map((shipId) => adjustedByShip[shipId])
      .filter((row): row is AdjustedCompliance => typeof row !== "undefined"),
    [adjustedByShip, selectedShips],
  );

  const poolSum = useMemo(
    () => adjustedRows.reduce((sum, row) => sum + row.adjustedComplianceBalance, 0),
    [adjustedRows],
  );

  const canCreatePool = selectedShips.length > 1 && poolSum >= 0 && !loading;

  const createPool = useCallback(async () => {
    if (!canCreatePool) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await service.createPool({
        shipIds: selectedShips,
        year,
      });
      setPoolResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create pool");
    } finally {
      setLoading(false);
    }
  }, [canCreatePool, selectedShips, service, year]);

  const ruleStatus = useMemo(() => {
    if (!poolResult) {
      return {
        sumNonNegative: poolSum >= 0,
        deficitNotWorse: true,
        surplusNotNegative: true,
      };
    }

    const deficitNotWorse = poolResult.members.every((member) => {
      if (member.cbBefore >= 0) {
        return true;
      }

      return member.cbAfter >= member.cbBefore;
    });

    const surplusNotNegative = poolResult.members.every((member) => {
      if (member.cbBefore <= 0) {
        return true;
      }

      return member.cbAfter >= 0;
    });

    return {
      sumNonNegative: poolResult.totalCbAfter >= 0,
      deficitNotWorse,
      surplusNotNegative,
    };
  }, [poolResult, poolSum]);

  return {
    shipOptions,
    selectedShips,
    toggleShip,
    year,
    setYear,
    adjustedRows,
    poolSum,
    canCreatePool,
    ruleStatus,
    poolResult,
    loading,
    error,
    createPool,
    refreshAdjustedBalances,
  };
}
