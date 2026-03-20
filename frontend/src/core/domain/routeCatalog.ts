export interface RouteCatalogEntry {
  shipId: string;
  routeId: string;
  vesselType: string;
  fuelType: string;
  year: number;
  ghgIntensity: number;
  fuelConsumptionTonnes: number;
  distanceKm: number;
  totalEmissionsTonnes: number;
}

export const ROUTE_CATALOG: RouteCatalogEntry[] = [
  {
    shipId: "SHIP_R001",
    routeId: "R001",
    vesselType: "Container",
    fuelType: "HFO",
    year: 2024,
    ghgIntensity: 91.0,
    fuelConsumptionTonnes: 5000,
    distanceKm: 12000,
    totalEmissionsTonnes: 4500,
  },
  {
    shipId: "SHIP_R002",
    routeId: "R002",
    vesselType: "BulkCarrier",
    fuelType: "LNG",
    year: 2024,
    ghgIntensity: 88.0,
    fuelConsumptionTonnes: 4800,
    distanceKm: 11500,
    totalEmissionsTonnes: 4200,
  },
  {
    shipId: "SHIP_R003",
    routeId: "R003",
    vesselType: "Tanker",
    fuelType: "MGO",
    year: 2024,
    ghgIntensity: 93.5,
    fuelConsumptionTonnes: 5100,
    distanceKm: 12500,
    totalEmissionsTonnes: 4700,
  },
  {
    shipId: "SHIP_R004",
    routeId: "R004",
    vesselType: "RoRo",
    fuelType: "HFO",
    year: 2025,
    ghgIntensity: 89.2,
    fuelConsumptionTonnes: 4900,
    distanceKm: 11800,
    totalEmissionsTonnes: 4300,
  },
  {
    shipId: "SHIP_R002",
    routeId: "R005",
    vesselType: "Container",
    fuelType: "LNG",
    year: 2025,
    ghgIntensity: 90.5,
    fuelConsumptionTonnes: 4950,
    distanceKm: 11900,
    totalEmissionsTonnes: 4400,
  },
];
