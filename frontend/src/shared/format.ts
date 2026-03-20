export function formatNumber(value: number, maximumFractionDigits = 2): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits }).format(value);
}

export function formatSignedPercent(value: number): string {
  const rounded = Number(value.toFixed(2));
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded.toFixed(2)}%`;
}

export function uniqueValues<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}
