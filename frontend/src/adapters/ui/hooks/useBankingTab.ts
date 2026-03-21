import { useCallback, useEffect, useMemo, useState } from "react";
import type { ApplySummary, ComplianceRecord } from "../../../core/domain/entities";
import type { BankingTabInputPort } from "../../../core/ports/inbound";

export function useBankingTab(service: BankingTabInputPort, shipOptions: string[], yearOptions: number[]) {
  const [shipId, setShipId] = useState("");
  const [year, setYear] = useState<number>(yearOptions[0] ?? new Date().getFullYear());
  const [compliance, setCompliance] = useState<ComplianceRecord | null>(null);
  const [records, setRecords] = useState<Array<{ id: string; amount: number; usedAmount: number; year: number }>>([]);
  const [bankAmount, setBankAmount] = useState<string>("");
  const [applyAmount, setApplyAmount] = useState<string>("");
  const [applySummary, setApplySummary] = useState<ApplySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shipId && shipOptions.length > 0) {
      setShipId(shipOptions[0]);
    }
  }, [shipId, shipOptions]);

  useEffect(() => {
    if (!yearOptions.includes(year) && yearOptions.length > 0) {
      setYear(yearOptions[0]);
    }
  }, [year, yearOptions]);

  const refresh = useCallback(async () => {
    if (!shipId || !year) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [cb, bankRecords, summary] = await Promise.all([
        service.getCompliance(shipId, year),
        service.getBankRecords(shipId, year),
        service.getBankApplySummary(shipId, year),
      ]);

      setCompliance(cb);
      setRecords(bankRecords);
      setApplySummary(summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load banking data");
    } finally {
      setLoading(false);
    }
  }, [service, shipId, year]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const bank = useCallback(async () => {
    if (!shipId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await service.bankPositive({
        shipId,
        year,
        amount: bankAmount ? Number(bankAmount) : undefined,
      });
      setBankAmount("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to bank surplus");
    } finally {
      setLoading(false);
    }
  }, [bankAmount, refresh, service, shipId, year]);

  const apply = useCallback(async () => {
    if (!shipId || !applyAmount) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await service.applyBank({
        shipId,
        year,
        amount: Number(applyAmount),
      });
      setApplyAmount("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to apply banked surplus");
    } finally {
      setLoading(false);
    }
  }, [applyAmount, refresh, service, shipId, year]);

  const cbBefore = applySummary?.cbBefore ?? compliance?.complianceBalance ?? 0;
  const applied = applySummary?.applied ?? 0;
  const cbAfter = applySummary?.cbAfter ?? cbBefore;
  const currentBalance = cbAfter;

  const canBank = useMemo(() => currentBalance > 0, [currentBalance]);
  const canApply = useMemo(() => currentBalance < 0, [currentBalance]);

  return {
    shipId,
    setShipId,
    year,
    setYear,
    compliance,
    records,
    bankAmount,
    setBankAmount,
    applyAmount,
    setApplyAmount,
    cbBefore,
    applied,
    cbAfter,
    canBank,
    canApply,
    loading,
    error,
    bank,
    apply,
    refresh,
  };
}
