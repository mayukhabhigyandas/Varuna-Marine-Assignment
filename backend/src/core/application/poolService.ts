import { DomainError } from "../domain/errors";
import { PoolMember, PoolTransfer } from "../domain/models";
import { PoolRepository } from "../ports/repositories";
import { BankingService } from "./bankingService";

interface CreatePoolInput {
  shipIds: string[];
  year: number;
}

export class PoolService {
  constructor(
    private readonly bankingService: BankingService,
    private readonly poolRepository: PoolRepository,
  ) {}

  async createPool(input: CreatePoolInput) {
    const uniqueShipIds = [...new Set(input.shipIds)];
    if (uniqueShipIds.length === 0) {
      throw new DomainError("shipIds cannot be empty", 400);
    }

    const cbByShip = new Map<string, number>();
    for (const shipId of uniqueShipIds) {
      const summary = await this.bankingService.getApplySummary(shipId, input.year);
      cbByShip.set(shipId, summary.cbAfter);
    }

    const totalCb = [...cbByShip.values()].reduce((sum, value) => sum + value, 0);
    if (totalCb < 0) {
      throw new DomainError("Total CB for pool must be >= 0", 400);
    }

    const sortedByCb = [...cbByShip.entries()].sort((a, b) => b[1] - a[1]);
    const shipCbAfter = new Map<string, number>(cbByShip);
    const transfers: PoolTransfer[] = [];

    const surplusShips = sortedByCb.map(([shipId]) => shipId).filter((shipId) => (shipCbAfter.get(shipId) ?? 0) > 0);
    const deficitShips = sortedByCb
      .map(([shipId]) => shipId)
      .filter((shipId) => (shipCbAfter.get(shipId) ?? 0) < 0)
      .sort((a, b) => (shipCbAfter.get(a) ?? 0) - (shipCbAfter.get(b) ?? 0));

    for (const deficitShipId of deficitShips) {
      let remainingDeficit = Math.abs(shipCbAfter.get(deficitShipId) ?? 0);

      for (const surplusShipId of surplusShips) {
        if (remainingDeficit <= 0) {
          break;
        }

        const availableSurplus = shipCbAfter.get(surplusShipId) ?? 0;
        if (availableSurplus <= 0) {
          continue;
        }

        const transferAmount = Math.min(availableSurplus, remainingDeficit);
        shipCbAfter.set(surplusShipId, availableSurplus - transferAmount);
        shipCbAfter.set(deficitShipId, (shipCbAfter.get(deficitShipId) ?? 0) + transferAmount);

        remainingDeficit -= transferAmount;
        transfers.push({
          fromShipId: surplusShipId,
          toShipId: deficitShipId,
          amount: transferAmount,
        });
      }
    }

    for (const [shipId, before] of cbByShip.entries()) {
      const after = shipCbAfter.get(shipId) ?? before;

      if (before < 0 && after < before) {
        throw new DomainError(`Deficit ship ${shipId} became worse than initial CB`, 400);
      }

      if (before > 0 && after < 0) {
        throw new DomainError(`Surplus ship ${shipId} became negative`, 400);
      }
    }

    const pool = await this.poolRepository.create({
      id: `pool-${Date.now()}`,
      year: input.year,
      shipIds: uniqueShipIds,
    });

    const members: PoolMember[] = uniqueShipIds.map((shipId) => ({
      poolId: pool.id,
      shipId,
      year: input.year,
      cbBefore: cbByShip.get(shipId) ?? 0,
      cbAfter: shipCbAfter.get(shipId) ?? 0,
    }));

    await this.poolRepository.saveMembers(members);

    return {
      pool,
      totalCbBefore: totalCb,
      totalCbAfter: members.reduce((sum, member) => sum + member.cbAfter, 0),
      transfers,
      members,
    };
  }
}
