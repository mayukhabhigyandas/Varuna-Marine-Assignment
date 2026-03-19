import { ENERGY_PER_TON_FUEL_MJ } from "./constants";

export function calculateEnergyInScopeMj(fuelConsumptionTons: number): number {
  return fuelConsumptionTons * ENERGY_PER_TON_FUEL_MJ;
}

export function calculateComplianceBalance(
  targetIntensity: number,
  actualIntensity: number,
  energyInScopeMj: number,
): number {
  return (targetIntensity - actualIntensity) * energyInScopeMj;
}
