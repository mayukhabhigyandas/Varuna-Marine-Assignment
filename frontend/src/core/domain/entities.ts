export interface ApiRoute {
  id: string;
  name?: string;
  year: number;
  intensity: number;
  isBaseline: boolean;
  routeId?: string;
  shipId?: string;
  vesselType?: string;
  fuelType?: string;
  fuelConsumptionTons?: number;
  distanceKm?: number;
  totalEmissionsTonnes?: number;
}

export interface RouteViewModel {
  routeId: string;
  shipId: string;
  vesselType: string;
  fuelType: string;
  year: number;
  ghgIntensity: number;
  fuelConsumptionTonnes: number;
  distanceKm: number;
  totalEmissionsTonnes: number;
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

export interface ComparisonViewModel {
  routeId: string;
  routeName: string;
  year: number;
  baselineRouteId: string;
  baselineIntensity: number;
  ghgIntensity: number;
  percentDiff: number;
  compliant: boolean;
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

export interface AdjustedCompliance {
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

export interface BankResult {
  entry: BankEntry;
  remainingBankable: number;
}

export interface ApplyResult {
  shipId: string;
  year: number;
  originalDeficit: number;
  appliedAmount: number;
  adjustedComplianceBalance: number;
  applications: Array<{ entryId: string; appliedAmount: number }>;
}

export interface PoolMember {
  poolId: string;
  shipId: string;
  year: number;
  cbBefore: number;
  cbAfter: number;
}

export interface PoolTransfer {
  fromShipId: string;
  toShipId: string;
  amount: number;
}

export interface PoolResult {
  pool: {
    id: string;
    year: number;
    shipIds: string[];
    createdAt: string;
  };
  totalCbBefore: number;
  totalCbAfter: number;
  transfers: PoolTransfer[];
  members: PoolMember[];
}
