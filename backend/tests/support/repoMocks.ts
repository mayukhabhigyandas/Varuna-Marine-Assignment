import {
  BankRepository,
  ComplianceRepository,
  PoolRepository,
  RouteRepository,
  ShipEmissionRepository,
} from "../../src/core/ports/repositories";
import { BankEntry, ComplianceRecord, Pool, PoolMember, Route, ShipYearEmission } from "../../src/core/domain/models";

export function createMockRouteRepository(overrides: Partial<RouteRepository> = {}): RouteRepository {
  return {
    getAll: async () => [],
    findById: async () => null,
    findBaselineByYear: async () => null,
    setBaseline: async (routeId: string) => ({
      id: routeId,
      name: "baseline",
      year: 2025,
      intensity: 90,
      isBaseline: true,
    }),
    ...overrides,
  };
}

export function createMockShipEmissionRepository(
  overrides: Partial<ShipEmissionRepository> = {},
): ShipEmissionRepository {
  return {
    findByShipIdAndYear: async () => null,
    ...overrides,
  };
}

export function createMockComplianceRepository(
  overrides: Partial<ComplianceRepository> = {},
): ComplianceRepository {
  return {
    save: async (record: ComplianceRecord) => record,
    findByShipIdAndYear: async () => null,
    ...overrides,
  };
}

export function createMockBankRepository(overrides: Partial<BankRepository> = {}): BankRepository {
  return {
    listByShip: async () => [],
    listByShipUpToYear: async () => [],
    create: async (entry: Omit<BankEntry, "id" | "createdAt">) => ({
      id: "bank-1",
      createdAt: new Date().toISOString(),
      ...entry,
    }),
    sumBankedFromComplianceYear: async () => 0,
    sumAppliedSnapshots: async () => 0,
    applyAmount: async () => [],
    saveApplySnapshot: async (snapshot) => ({
      id: "apply-1",
      createdAt: new Date().toISOString(),
      ...snapshot,
    }),
    getLatestApplySnapshot: async () => null,
    ...overrides,
  };
}

export function createMockPoolRepository(overrides: Partial<PoolRepository> = {}): PoolRepository {
  return {
    create: async (pool: Omit<Pool, "createdAt">) => ({
      ...pool,
      createdAt: new Date().toISOString(),
    }),
    listByYear: async () => [],
    saveMembers: async (members: PoolMember[]) => members,
    ...overrides,
  };
}

export function makeEmission(shipId: string, year: number, actualIntensity: number): ShipYearEmission {
  return {
    shipId,
    year,
    fuelConsumptionTons: 100,
    actualIntensity,
  };
}

export function makeRoute(
  id: string,
  year: number,
  intensity: number,
  isBaseline: boolean,
  name = id,
): Route {
  return {
    id,
    name,
    year,
    intensity,
    isBaseline,
  };
}
