import { PrismaClient } from "@prisma/client";
import {
  BankApplySnapshot,
  BankApplication,
  BankEntry,
  ComplianceRecord,
  Pool,
  PoolMember,
  Route,
  ShipYearEmission,
} from "../../../core/domain/models";
import {
  BankRepository,
  ComplianceRepository,
  PoolRepository,
  RouteRepository,
  ShipEmissionRepository,
} from "../../../core/ports/repositories";

export class PostgresRouteRepository implements RouteRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getAll(): Promise<Route[]> {
    return this.prisma.route.findMany({
      orderBy: [{ year: "desc" }, { name: "asc" }],
    });
  }

  async findById(routeId: string): Promise<Route | null> {
    return this.prisma.route.findUnique({ where: { id: routeId } });
  }

  async findBaselineByYear(year: number): Promise<Route | null> {
    return this.prisma.route.findFirst({
      where: { year, isBaseline: true },
      orderBy: { id: "asc" },
    });
  }

  async setBaseline(routeId: string): Promise<Route> {
    const routeToSet = await this.prisma.route.findUnique({ where: { id: routeId } });
    if (!routeToSet) {
      throw new Error(`Route ${routeId} not found`);
    }

    await this.prisma.$transaction([
      this.prisma.route.updateMany({
        where: { isBaseline: true },
        data: { isBaseline: false },
      }),
      this.prisma.route.update({
        where: { id: routeId },
        data: { isBaseline: true },
      }),
    ]);

    const updated = await this.prisma.route.findUnique({ where: { id: routeId } });
    if (!updated) {
      throw new Error(`Route ${routeId} not found after baseline update`);
    }

    return updated;
  }
}

export class PostgresShipEmissionRepository implements ShipEmissionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByShipIdAndYear(shipId: string, year: number): Promise<ShipYearEmission | null> {
    return this.prisma.shipEmission.findUnique({
      where: {
        shipId_year: {
          shipId,
          year,
        },
      },
    });
  }
}

export class PostgresComplianceRepository implements ComplianceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(record: ComplianceRecord): Promise<ComplianceRecord> {
    const saved = await this.prisma.complianceRecord.upsert({
      where: {
        shipId_year: {
          shipId: record.shipId,
          year: record.year,
        },
      },
      update: {
        targetIntensity: record.targetIntensity,
        actualIntensity: record.actualIntensity,
        energyInScopeMj: record.energyInScopeMj,
        complianceBalance: record.complianceBalance,
        createdAt: new Date(record.createdAt),
      },
      create: {
        shipId: record.shipId,
        year: record.year,
        targetIntensity: record.targetIntensity,
        actualIntensity: record.actualIntensity,
        energyInScopeMj: record.energyInScopeMj,
        complianceBalance: record.complianceBalance,
        createdAt: new Date(record.createdAt),
      },
    });

    return {
      ...saved,
      createdAt: saved.createdAt.toISOString(),
    };
  }

  async findByShipIdAndYear(shipId: string, year: number): Promise<ComplianceRecord | null> {
    const record = await this.prisma.complianceRecord.findUnique({
      where: {
        shipId_year: {
          shipId,
          year,
        },
      },
    });

    if (!record) {
      return null;
    }

    return {
      ...record,
      createdAt: record.createdAt.toISOString(),
    };
  }
}

export class PostgresBankRepository implements BankRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listByShip(shipId: string, year?: number): Promise<BankEntry[]> {
    const entries = await this.prisma.bankEntry.findMany({
      where: {
        shipId,
        ...(typeof year === "number" ? { year } : {}),
      },
      orderBy: [{ year: "asc" }, { createdAt: "asc" }],
    });

    return entries.map((entry) => ({
      ...entry,
      createdAt: entry.createdAt.toISOString(),
    }));
  }

  async listByShipUpToYear(shipId: string, year: number): Promise<BankEntry[]> {
    const entries = await this.prisma.bankEntry.findMany({
      where: {
        shipId,
        year: { lte: year },
      },
      orderBy: [{ year: "asc" }, { createdAt: "asc" }],
    });

    return entries.map((entry) => ({
      ...entry,
      createdAt: entry.createdAt.toISOString(),
    }));
  }

  async create(entry: Omit<BankEntry, "id" | "createdAt">): Promise<BankEntry> {
    const created = await this.prisma.bankEntry.create({
      data: {
        shipId: entry.shipId,
        year: entry.year,
        amount: entry.amount,
        usedAmount: entry.usedAmount,
        sourceComplianceYear: entry.sourceComplianceYear,
      },
    });

    return {
      ...created,
      createdAt: created.createdAt.toISOString(),
    };
  }

  async sumBankedFromComplianceYear(shipId: string, sourceComplianceYear: number): Promise<number> {
    const result = await this.prisma.bankEntry.aggregate({
      where: {
        shipId,
        sourceComplianceYear,
      },
      _sum: {
        amount: true,
      },
    });

    return result._sum.amount ?? 0;
  }

  async sumAppliedSnapshots(shipId: string, year: number): Promise<number> {
    const result = await this.prisma.bankApplySnapshot.aggregate({
      where: { shipId, year },
      _sum: { applied: true },
    });

    return result._sum.applied ?? 0;
  }

  async applyAmount(shipId: string, upToYear: number, amount: number): Promise<BankApplication[]> {
    return this.prisma.$transaction(async (transaction) => {
      let remaining = amount;
      const applications: BankApplication[] = [];

      const sorted = await transaction.bankEntry.findMany({
        where: {
          shipId,
          year: { lte: upToYear },
        },
        orderBy: [{ year: "asc" }, { createdAt: "asc" }],
      });

      for (const entry of sorted) {
        if (remaining <= 0) {
          break;
        }

        const available = entry.amount - entry.usedAmount;
        if (available <= 0) {
          continue;
        }

        const applied = Math.min(available, remaining);

        await transaction.bankEntry.update({
          where: { id: entry.id },
          data: {
            usedAmount: entry.usedAmount + applied,
          },
        });

        remaining -= applied;
        applications.push({
          entryId: entry.id,
          appliedAmount: applied,
        });
      }

      if (remaining > 0) {
        throw new Error("Unable to apply requested amount from bank entries");
      }

      return applications;
    });
  }

  async saveApplySnapshot(snapshot: Omit<BankApplySnapshot, "id" | "createdAt">): Promise<BankApplySnapshot> {
    const created = await this.prisma.bankApplySnapshot.create({
      data: {
        shipId: snapshot.shipId,
        year: snapshot.year,
        cbBefore: snapshot.cbBefore,
        applied: snapshot.applied,
        cbAfter: snapshot.cbAfter,
      },
    });

    return {
      ...created,
      createdAt: created.createdAt.toISOString(),
    };
  }

  async getLatestApplySnapshot(shipId: string, year: number): Promise<BankApplySnapshot | null> {
    const snapshot = await this.prisma.bankApplySnapshot.findFirst({
      where: { shipId, year },
      orderBy: { createdAt: "desc" },
    });

    if (!snapshot) {
      return null;
    }

    return {
      ...snapshot,
      createdAt: snapshot.createdAt.toISOString(),
    };
  }
}

export class PostgresPoolRepository implements PoolRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(pool: Omit<Pool, "createdAt">): Promise<Pool> {
    const created = await this.prisma.pool.create({
      data: {
        id: pool.id,
        year: pool.year,
        shipIds: pool.shipIds,
      },
    });

    return {
      ...created,
      createdAt: created.createdAt.toISOString(),
    };
  }

  async saveMembers(members: PoolMember[]): Promise<PoolMember[]> {
    await this.prisma.poolMember.createMany({
      data: members.map((member) => ({
        poolId: member.poolId,
        shipId: member.shipId,
        year: member.year,
        cbBefore: member.cbBefore,
        cbAfter: member.cbAfter,
      })),
    });

    return members.map((member) => ({ ...member }));
  }
}
