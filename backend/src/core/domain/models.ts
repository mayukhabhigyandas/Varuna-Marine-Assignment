export interface Route {
  id: string;
  name: string;
  year: number;
  intensity: number;
  isBaseline: boolean;
}

export interface RouteComparison {
  routeId: string;
  routeName: string;
  year: number;
  baselineRouteId: string;
  baselineIntensity: number;
  routeIntensity: number;
  percentDiff: number;
  compliant: boolean;
}

export interface ShipYearEmission {
  shipId: string;
  routeId?: string;
  year: number;
  vesselType?: string;
  fuelType?: string;
  fuelConsumptionTons: number;
  distanceKm?: number;
  totalEmissionsTonnes?: number;
  actualIntensity: number;
}

export interface ComplianceRecord {
  shipId: string;
  year: number;
  targetIntensity: number;
  actualIntensity: number;
  energyInScopeMj: number;
  complianceBalance: number;
  createdAt: string;
}

export interface AdjustedComplianceResult {
  shipId: string;
  year: number;
  rawComplianceBalance: number;
  adjustedComplianceBalance: number;
  appliedFromBank: number;
  availableBankBeforeApply: number;
}

export interface BankEntry {
  id: string;
  shipId: string;
  year: number;
  amount: number;
  usedAmount: number;
  sourceComplianceYear: number;
  createdAt: string;
}

export interface BankApplication {
  entryId: string;
  appliedAmount: number;
}

export interface Pool {
  id: string;
  year: number;
  shipIds: string[];
  createdAt: string;
}

export interface PoolTransfer {
  fromShipId: string;
  toShipId: string;
  amount: number;
}

export interface PoolMember {
  poolId: string;
  shipId: string;
  year: number;
  cbBefore: number;
  cbAfter: number;
}
