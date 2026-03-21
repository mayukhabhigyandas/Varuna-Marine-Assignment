import { MarineDashboardService } from "../../../core/application/marineDashboardService";
import { formatNumber } from "../../../shared/format";
import { StatusPill } from "../components/StatusPill";
import { useFleetRoutes } from "../hooks/useFleetRoutes";
import { usePoolingTab } from "../hooks/usePoolingTab";

interface PoolingTabProps {
  service: MarineDashboardService;
}

export function PoolingTab({ service }: PoolingTabProps) {
  const fleet = useFleetRoutes(service);
  const pooling = usePoolingTab(service, fleet.shipOptions, fleet.yearOptions);

  return (
    <section className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Year
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            value={pooling.year}
            onChange={(event) => pooling.setYear(Number(event.target.value))}
            disabled={fleet.yearOptions.length === 0}
          >
            {fleet.yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-slate-500">Pool Sum Indicator</p>
          <p className={`mt-1 text-2xl font-semibold ${pooling.poolSum >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
            {formatNumber(pooling.poolSum, 2)}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="mb-2 text-sm font-semibold text-slate-700">Select Pool Members</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {fleet.shipOptions.map((shipId) => {
            const selected = pooling.selectedShips.includes(shipId);

            return (
              <label
                key={shipId}
                className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                  selected ? "border-cyan-600 bg-cyan-50" : "border-slate-300 bg-white"
                }`}
              >
                {shipId}
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => pooling.toggleShip(shipId)}
                  className="h-4 w-4"
                />
              </label>
            );
          })}
        </div>
      </div>

      {fleet.error ? <p className="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700">{fleet.error}</p> : null}
      {pooling.error ? <p className="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700">{pooling.error}</p> : null}
      {pooling.loading ? <p className="text-sm text-slate-600">Loading pooling data...</p> : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatusPill ok={pooling.ruleStatus.sumNonNegative} trueLabel="Sum(adjustedCB) >= 0" falseLabel="Sum(adjustedCB) < 0" />
        <StatusPill ok={pooling.ruleStatus.deficitNotWorse} trueLabel="Deficit ships improved" falseLabel="Deficit ship worsened" />
        <StatusPill ok={pooling.ruleStatus.surplusNotNegative} trueLabel="Surplus ships non-negative" falseLabel="Surplus ship turned negative" />
      </div>

      <button
        className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        disabled={!pooling.canCreatePool}
        onClick={() => void pooling.createPool()}
      >
        Create Pool
      </button>
      {pooling.hasCreatedCurrentSelection ? (
        <p className="text-sm text-slate-600">
          Pool already created for this ship combination in the selected year.
        </p>
      ) : null}

      <div className="overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase text-slate-600">
            <tr>
              <th className="px-3 py-2">Ship</th>
              <th className="px-3 py-2">cb_before</th>
              <th className="px-3 py-2">cb_after</th>
            </tr>
          </thead>
          <tbody>
            {(pooling.poolResult?.members ?? pooling.adjustedRows.map((row) => ({
              shipId: row.shipId,
              cbBefore: row.rawComplianceBalance,
              cbAfter: row.adjustedComplianceBalance,
            }))).map((row) => (
              <tr key={row.shipId} className="border-t border-slate-200">
                <td className="px-3 py-2 font-semibold text-slate-900">{row.shipId}</td>
                <td className="px-3 py-2">{formatNumber(row.cbBefore, 2)}</td>
                <td className="px-3 py-2">{formatNumber(row.cbAfter, 2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
