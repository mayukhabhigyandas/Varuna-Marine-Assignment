import { useMemo, useState } from "react";
import { TAB_NAMES } from "../../core/domain/constants";
import type { TabName } from "../../core/domain/constants";
import { marineDashboardService } from "../infrastructure/serviceFactory";
import { BankingTab } from "./tabs/BankingTab";
import { CompareTab } from "./tabs/CompareTab";
import { PoolingTab } from "./tabs/PoolingTab";
import { RoutesTab } from "./tabs/RoutesTab";

export function AppShell() {
  const [activeTab, setActiveTab] = useState<TabName>("Routes");

  const title = useMemo(() => {
    switch (activeTab) {
      case "Routes":
        return "Route Catalogue & Baseline Selection";
      case "Compare":
        return "Baseline Comparison and Compliance Trend";
      case "Banking":
        return "FuelEU Article 20 Banking Controls";
      case "Pooling":
        return "FuelEU Article 21 Pooling Controls";
      default:
        return "Varuna Marine Dashboard";
    }
  }, [activeTab]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#e0f2fe_0%,_#f8fafc_35%,_#f8fafc_100%)] px-4 py-6 text-slate-900 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Varuna Marine Operations Console</h1>
          <p className="text-sm text-slate-600 md:text-base">{title}</p>
        </header>

        <nav className="flex flex-wrap gap-2">
          {TAB_NAMES.map((tab) => (
            <button
              key={tab}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab
                  ? "bg-cyan-700 text-white shadow"
                  : "bg-white text-slate-700 hover:bg-slate-100"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>

        <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur md:p-6">
          {activeTab === "Routes" ? <RoutesTab service={marineDashboardService} /> : null}
          {activeTab === "Compare" ? <CompareTab service={marineDashboardService} /> : null}
          {activeTab === "Banking" ? <BankingTab service={marineDashboardService} /> : null}
          {activeTab === "Pooling" ? <PoolingTab service={marineDashboardService} /> : null}
        </section>
      </div>
    </main>
  );
}
