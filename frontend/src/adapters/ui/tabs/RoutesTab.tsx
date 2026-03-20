import { MarineDashboardService } from "../../../core/application/marineDashboardService";
import { formatNumber } from "../../../shared/format";
import { StatusPill } from "../components/StatusPill";
import { useRoutesTab } from "../hooks/useRoutesTab";

interface RoutesTabProps {
  service: MarineDashboardService;
}

export function RoutesTab({ service }: RoutesTabProps) {
  const {
    loading,
    error,
    routes,
    filters,
    vesselTypeOptions,
    fuelTypeOptions,
    yearOptions,
    baselineUpdatingId,
    setBaseline,
    updateFilter,
  } = useRoutesTab(service);

  return (
    <section className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <label className="text-sm font-medium text-slate-700">
          Vessel Type
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            value={filters.vesselType}
            onChange={(event) => updateFilter("vesselType", event.target.value)}
          >
            <option value="all">All</option>
            {vesselTypeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700">
          Fuel Type
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            value={filters.fuelType}
            onChange={(event) => updateFilter("fuelType", event.target.value)}
          >
            <option value="all">All</option>
            {fuelTypeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700">
          Year
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            value={filters.year}
            onChange={(event) => updateFilter("year", event.target.value)}
          >
            <option value="all">All</option>
            {yearOptions.map((option) => (
              <option key={option} value={String(option)}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? <p className="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      {loading ? <p className="text-sm text-slate-600">Loading routes...</p> : null}

      <div className="overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase text-slate-600">
            <tr>
              <th className="px-3 py-2">Route ID</th>
              <th className="px-3 py-2">Vessel Type</th>
              <th className="px-3 py-2">Fuel Type</th>
              <th className="px-3 py-2">Year</th>
              <th className="px-3 py-2">ghgIntensity (gCO2e/MJ)</th>
              <th className="px-3 py-2">Fuel Consumption (t)</th>
              <th className="px-3 py-2">Distance (km)</th>
              <th className="px-3 py-2">Total Emissions (t)</th>
              <th className="px-3 py-2">Baseline</th>
              <th className="px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {routes.map((route) => (
              <tr key={route.routeId} className="border-t border-slate-200">
                <td className="px-3 py-2 font-semibold text-slate-900">{route.routeId}</td>
                <td className="px-3 py-2">{route.vesselType}</td>
                <td className="px-3 py-2">{route.fuelType}</td>
                <td className="px-3 py-2">{route.year}</td>
                <td className="px-3 py-2">{formatNumber(route.ghgIntensity, 4)}</td>
                <td className="px-3 py-2">{formatNumber(route.fuelConsumptionTonnes)}</td>
                <td className="px-3 py-2">{formatNumber(route.distanceKm)}</td>
                <td className="px-3 py-2">{formatNumber(route.totalEmissionsTonnes)}</td>
                <td className="px-3 py-2">
                  <StatusPill ok={route.isBaseline} trueLabel="Baseline" falseLabel="Not Baseline" />
                </td>
                <td className="px-3 py-2">
                  <button
                    className="rounded-lg bg-cyan-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                    onClick={() => void setBaseline(route.routeId)}
                    disabled={route.isBaseline || baselineUpdatingId === route.routeId}
                  >
                    {baselineUpdatingId === route.routeId ? "Setting..." : "Set Baseline"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
