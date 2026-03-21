import {
  BankApplySnapshot,
  BankApplication,
  BankEntry,
  ComplianceRecord,
  Pool,
  PoolMember,
  Route,
  ShipYearEmission,
} from "../domain/models";

export interface RouteRepository {
  getAll(): Promise<Route[]>;
  findById(routeId: string): Promise<Route | null>;
  findBaselineByYear(year: number): Promise<Route | null>;
  setBaseline(routeId: string): Promise<Route>;
}

export interface ShipEmissionRepository {
  findByShipIdAndYear(shipId: string, year: number): Promise<ShipYearEmission | null>;
}

export interface ComplianceRepository {
  save(record: ComplianceRecord): Promise<ComplianceRecord>;
  findByShipIdAndYear(shipId: string, year: number): Promise<ComplianceRecord | null>;
}

export interface BankRepository {
  listByShip(shipId: string, year?: number): Promise<BankEntry[]>;
  listByShipUpToYear(shipId: string, year: number): Promise<BankEntry[]>;
  create(entry: Omit<BankEntry, "id" | "createdAt">): Promise<BankEntry>;
  sumBankedFromComplianceYear(shipId: string, sourceComplianceYear: number): Promise<number>;
  sumAppliedSnapshots(shipId: string, year: number): Promise<number>;
  applyAmount(shipId: string, upToYear: number, amount: number): Promise<BankApplication[]>;
  saveApplySnapshot(snapshot: Omit<BankApplySnapshot, "id" | "createdAt">): Promise<BankApplySnapshot>;
  getLatestApplySnapshot(shipId: string, year: number): Promise<BankApplySnapshot | null>;
}

export interface PoolRepository {
  create(pool: Omit<Pool, "createdAt">): Promise<Pool>;
  listByYear(year: number): Promise<Pool[]>;
  saveMembers(members: PoolMember[]): Promise<PoolMember[]>;
}
