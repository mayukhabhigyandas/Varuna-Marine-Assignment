import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MarineDashboardService } from "../../../core/application/marineDashboardService";
import { formatNumber, formatSignedPercent } from "../../../shared/format";
import { StatusPill } from "../components/StatusPill";
import { useCompareTab } from "../hooks/useCompareTab";

interface CompareTabProps {
  service: MarineDashboardService;
}

export function CompareTab({ service }: CompareTabProps) {
  const {
    loading,
    error,
    selectedYear,
    setSelectedYear,
    comparisons,
    yearOptions,
    chartData,
    target,
  } = useCompareTab(service);

  return (
    <section className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <label className="text-sm font-medium text-slate-700">
          Year
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            value={selectedYear}
            onChange={(event) => setSelectedYear(event.target.value)}
          >
            <option value="all">All years</option>
            {yearOptions.map((year) => (
              <option key={year} value={String(year)}>
                {year}
              </option>
            ))}
          </select>
        </label>

        <div className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm text-cyan-900 md:col-span-3">
          Target intensity fixed at <strong>{formatNumber(target, 4)} gCO2e/MJ</strong> (2% below 91.16)
        </div>
      </div>

      {error ? <p className="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      {loading ? <p className="text-sm text-slate-600">Loading comparison data...</p> : null}

      <div className="overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase text-slate-600">
            <tr>
              <th className="px-3 py-2">Route</th>
              <th className="px-3 py-2">Baseline Route</th>
              <th className="px-3 py-2">Baseline Intensity</th>
              <th className="px-3 py-2">ghgIntensity</th>
              <th className="px-3 py-2">% Difference</th>
              <th className="px-3 py-2">Compliant</th>
            </tr>
          </thead>
          <tbody>
            {comparisons.map((row) => (
              <tr key={`${row.routeId}-${row.year}`} className="border-t border-slate-200">
                <td className="px-3 py-2 font-semibold text-slate-900">{row.routeId}</td>
                <td className="px-3 py-2">{row.baselineRouteId}</td>
                <td className="px-3 py-2">{formatNumber(row.baselineIntensity, 4)}</td>
                <td className="px-3 py-2">{formatNumber(row.ghgIntensity, 4)}</td>
                <td className="px-3 py-2">{formatSignedPercent(row.percentDiff)}</td>
                <td className="px-3 py-2">
                  <StatusPill ok={row.compliant} trueLabel="✅" falseLabel="❌" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="h-72 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="route" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="baseline" stroke="#0e7490" strokeWidth={2} name="Baseline" />
            <Line type="monotone" dataKey="ghg" stroke="#f97316" strokeWidth={2} name="Route" />
            <Line type="monotone" dataKey="target" stroke="#16a34a" strokeWidth={2} name="Target" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
