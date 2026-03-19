import { DomainError } from "../core/domain/errors";

export function requireQueryString(value: unknown, name: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new DomainError(`Missing query parameter: ${name}`, 400);
  }

  return value.trim();
}

export function requireInteger(value: unknown, name: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    throw new DomainError(`${name} must be an integer`, 400);
  }

  return parsed;
}

export function requirePositiveNumber(value: unknown, name: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new DomainError(`${name} must be a positive number`, 400);
  }

  return parsed;
}

export function optionalNumber(value: unknown): number | undefined {
  if (typeof value === "undefined") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
