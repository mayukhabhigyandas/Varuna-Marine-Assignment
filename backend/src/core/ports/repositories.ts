import {
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
  applyAmount(shipId: string, upToYear: number, amount: number): Promise<BankApplication[]>;
}

export interface PoolRepository {
  create(pool: Omit<Pool, "createdAt">): Promise<Pool>;
  saveMembers(members: PoolMember[]): Promise<PoolMember[]>;
}
