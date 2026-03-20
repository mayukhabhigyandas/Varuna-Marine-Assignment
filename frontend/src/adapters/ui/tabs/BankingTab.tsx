import { MarineDashboardService } from "../../../core/application/marineDashboardService";
import { formatNumber } from "../../../shared/format";
import { useBankingTab } from "../hooks/useBankingTab";
import { useFleetRoutes } from "../hooks/useFleetRoutes";

interface BankingTabProps {
  service: MarineDashboardService;
}

export function BankingTab({ service }: BankingTabProps) {
  const fleet = useFleetRoutes(service);
  const banking = useBankingTab(service, fleet.shipOptions, fleet.yearOptions);

  const hasFleetData = fleet.shipOptions.length > 0;

  return (
    <section className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Ship
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            value={banking.shipId}
            onChange={(event) => banking.setShipId(event.target.value)}
            disabled={!hasFleetData}
          >
            {!hasFleetData ? <option value="">No ships</option> : null}
            {fleet.shipOptions.map((shipId) => (
              <option key={shipId} value={shipId}>
                {shipId}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700">
          Year
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            value={banking.year}
            onChange={(event) => banking.setYear(Number(event.target.value))}
            disabled={fleet.yearOptions.length === 0}
          >
            {fleet.yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
      </div>

      {fleet.error ? <p className="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700">{fleet.error}</p> : null}
      {banking.error ? <p className="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700">{banking.error}</p> : null}
      {banking.loading ? <p className="text-sm text-slate-600">Loading banking data...</p> : null}

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-slate-500">cb_before</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{formatNumber(banking.cbBefore, 2)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-slate-500">applied</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{formatNumber(banking.applied, 2)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-slate-500">cb_after</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{formatNumber(banking.cbAfter, 2)}</p>
        </div>
      </div>

      <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase text-slate-700">POST /banking/bank</h3>
          <input
            type="number"
            placeholder="Amount (optional)"
            value={banking.bankAmount}
            onChange={(event) => banking.setBankAmount(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <button
            className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            onClick={() => void banking.bank()}
            disabled={!banking.canBank || banking.loading || !hasFleetData}
          >
            Bank Positive CB
          </button>
          {!banking.canBank ? (
            <p className="text-xs text-amber-700">Action disabled because CB ≤ 0.</p>
          ) : null}
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase text-slate-700">POST /banking/apply</h3>
          <input
            type="number"
            placeholder="Amount to apply"
            value={banking.applyAmount}
            onChange={(event) => banking.setApplyAmount(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <button
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            onClick={() => void banking.apply()}
            disabled={!banking.canApply || banking.loading || !hasFleetData || !banking.applyAmount}
          >
            Apply Banked Surplus
          </button>
          {!banking.canApply ? (
            <p className="text-xs text-amber-700">Action disabled because CB is not deficit.</p>
          ) : null}
        </div>
      </div>

      <div className="overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase text-slate-600">
            <tr>
              <th className="px-3 py-2">Entry ID</th>
              <th className="px-3 py-2">Year</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Used</th>
            </tr>
          </thead>
          <tbody>
            {banking.records.map((record) => (
              <tr key={record.id} className="border-t border-slate-200">
                <td className="px-3 py-2">{record.id}</td>
                <td className="px-3 py-2">{record.year}</td>
                <td className="px-3 py-2">{formatNumber(record.amount)}</td>
                <td className="px-3 py-2">{formatNumber(record.usedAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
